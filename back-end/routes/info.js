const express = require('express');
const { requireAuth } = require('../lib/auth');
const bodyParser = require('body-parser');
const { addInfoInDB, getInfoInDB, removeInfoInDB, getInfoByUserIdInDB, getInfoByUserIDAndBucketFileNameInDB, updateInfoInDB } = require('../db/info');
const getV4ReadSignedUrl = require('../lib/generate-v4-read-signed-url');
const {analyzeFileByDocumentAI, matchEntityTypes, lineItemEntityTypes, numberEntityTypes, priceEntityTypes} = require('../lib/document-ai');
const {fileTypeChecker, getContentType} = require('../lib/support-file-type');
const { addInfoToUserInDB, removeInfoFromUserInDB } = require('../db/users');
const deleteFile = require('../lib/cloud-storage-file-delete');

const bucketName = process.env.BUCKET_NAME;

let jsonBodyParser = bodyParser.json();

let bucketFileNameChecker = (req, res, next) => {
    const bucketFileName = req.body.bucketFileName;
    if (! bucketFileName) {
        res.status(500).send({message: "bucketFileName is not in request body!"});
        return;
    }
    next();
};

let modifiedInfoContentFilter = (req, res, next) => {
    const requestBody = req.body;
    const analyzedResults = requestBody.analyzedResults;
    remove_key = [];
    for (const key in analyzedResults) {
        const value = analyzedResults[key];
        if (! matchEntityTypes.includes(key) && key !== 'line_items') {
            remove_key.push(key);
        }
        if (key === 'line_items') {
            for (const line_item of value) {
                line_item_remove_key = [];
                for (const line_item_key in line_item) {
                    const line_item_value = line_item[line_item_key];
                    if (! lineItemEntityTypes.includes(line_item_key) && line_item_key !== 'line_string') {
                        line_item_remove_key.push(line_item_key);
                    }
                    if (numberEntityTypes.includes(line_item_key) && ! isNumericOrNull(line_item_value)) {
                        res.status(422).send({message: `Entity ${line_item_key} for line_item shoule be either a number or null, but ${line_item_value} is given!`, entity: line_item_key, value: line_item_value});
                        return;
                    }
                    if (priceEntityTypes.includes(line_item_key) && line_item_value) {
                        line_item[line_item_key] = parseFloat(line_item_value).toFixed(2).toString();
                    }
                }
                line_item_remove_key.forEach((line_item_key) => {
                    delete line_item[line_item_key];
                });
            }
        }
        if (numberEntityTypes.includes(key) && ! isNumericOrNull(value)) {
            res.status(422).send({message: `Entity ${key} shoule be either a number or null, but ${value} is given!`, entity: key, value: value});
            return;
        }
        if (priceEntityTypes.includes(key) && value) {
            analyzedResults[key] = parseFloat(value).toFixed(2).toString();
        }
    }
    remove_key.forEach((key) => {
        delete analyzedResults[key];
    });
    req.modifiedAnalyzedResults = analyzedResults;
    next();
};

let userAddInfoRoute = async (req, res) => { // Probably add a middleware to process the record metadata.
    const userID = req.user.userID;
    const requestBody = req.body;
    // const contentType = getContentType(requestBody.fileType);
    const contentType = 'image/png';
    console.log(requestBody);
    const bucketFileName = requestBody.bucketFileName;
    const fileName = bucketFileName.substring(37);
    const dateAdded = new Date();
    const dateLastModified = dateAdded;
    const imageURL = `https://storage.cloud.google.com/${bucketName}/${userID}/${bucketFileName}`; // Incorrect URL leads to 404 not found! // Check if necessary to record.
    // Document AI
    let infoContent;
    try {
        infoContent = await analyzeFileByDocumentAI(userID, bucketFileName, contentType); // Call Document AI!
    } catch (error) {
        res.status(error.status || 400).send({...error, message: error.message});
        return;
    }
    // Add to MongoDB Atlas
    const doc = {userID, contentType, fileName, bucketFileName, imageURL, dateAdded, dateLastModified, analyzedResults: infoContent['selectedEntities']};
    res.status(201).send({...doc, message: "The info record will appear on your account in a few seconds."}); // check infoID key repetition in returned doc
    try {
        const infoID = await addInfoInDB({...doc, analyzedResults: infoContent});
        // const infoIDs = await addInfoToUserInDB(userID, infoID);
        // const clientGetImageURL = await getV4ReadSignedUrl(userID, bucketFileName); // check if necessary, or return to client an image processed by the Document AI
    } catch (error) {
        console.log({...error, message: error.message});
    }
};

let userRemoveInfoRoute = async (req, res) => {
    const userID = req.user.userID;
    const infoID = req.params.info_id;
    console.log(userID);
    // Get document from MongoDB Atlas
    let infoRecord;
    try {
        infoRecord = await getInfoInDB(infoID);
    } catch (error) {
        res.status(error.status || 400).send({...error, message: error.message || `Error in userRemoveInfoRoute() for user ${userID} retrieving record ${infoID} in DB!`});
        return;
    }
    if (userID !== infoRecord.userID) {
        res.status(404).send({"message": `User ${userID} does not have info record ${infoID}!`});
        return;
    }
    // Delete Cloud Storage File
    const bucketFileName = infoRecord.bucketFileName;
    try {
        await deleteFile(userID, bucketFileName);
    } catch (error) {
        res.status(error.status || 400).send({...error, message: error.message || `Error in userRemoveInfoRoute() for user ${userID} deleting static content in Cloud Storage for info record ${infoID}!`});
        return;
    }
    // Remove from MongoDB Atlas
    try {
        // await removeInfoInDB(infoID);
        // const infoIDs = await removeInfoFromUserInDB(userID, infoID);
        // res.status(200).send({infoIDs});
        await removeInfoInDB(infoID);
        // const infoIDs = await removeInfoFromUserInDB(userID, infoID);
        res.status(200).send({infoID});
    } catch (error) {
        res.status(error.status || 400).send({...error, message: error.message || `Error in userRemoveInfoRoute() for user ${userID} removing record ${infoID} in DB!`});
    }
};

let userGetInfoRoute = async (req, res) => {
    const userID = req.user.userID;
    const infoID = req.params.info_id;
    // Get document from MongoDB Atlas
    let infoRecord;
    try {
        infoRecord = await getInfoInDB(infoID);
    } catch (error) {
        res.status(error.status || 400).send({...error, message: error.message || `Error in userGetInfoRoute() for user ${userID} retrieving record ${infoID} in DB!`});
        return;
    }
    if (userID !== infoRecord.userID) {
        res.status(404).send({"message": `User ${userID} does not have info record ${infoID}!`});
        return;
    }
    res.status(200).send({...infoRecord, analyzedResults: infoRecord.analyzedResults['selectedEntities']});
};

let userGetAllInfoRoute = async (req, res) => {
    const userID = req.user.userID;
    // Get document from MongoDB Atlas
    let infoRecords;
    try {
        // changed the function name
        infoRecords = await getInfoByUserIdInDB(userID);
    } catch (error) {
        res.status(error.status || 400).send({...error, message: error.message || `Error in userGetAllInfoRoute() for user ${userID} retrieving record ${infoID} in DB!`});
        return;
    }
    infoRecords = infoRecords.map((record) => {
        return {...record, analyzedResults: record.analyzedResults['selectedEntities']};
    });
    res.status(200).send({expenseSummary: calculateExpenseSummary(infoRecords), infoRecords});
};

let userModifyInfoRoute = async (req, res) => {
    const userID = req.user.userID;
    const modifiedAnalyzedResults = req.modifiedAnalyzedResults;
    let infoID;
    try {
        infoID = req.params.info_id || (((await getInfoByUserIDAndBucketFileNameInDB(userID, req.body.bucketFileName))?._id || '').toString());
        if (! infoID) {
            res.status(404).send({message: `Cannot find info: either info_id ${req.params.info_id} is missing in URL, or user ${userID} does not have info with bucketFileName ${req.body.bucketFileName}. If the info has been just added, please wait for a few more seconds and re-try.`});
            return;
        }
    } catch (error) {
        res.status(error.status || 400).send({...error, message: error.message || `Error in userModifyInfoRoute() for user ${userID} retrieving record by bucketFileName ${req.body.bucketFileName} in DB!`});
        return;
    }
    try {
        const updatedInfo = await updateInfoInDB(infoID, {dateLastModified: new Date(), "analyzedResults.selectedEntities": modifiedAnalyzedResults});
        res.status(200).send({...updatedInfo, analyzedResults: updatedInfo.analyzedResults['selectedEntities']});
    } catch (error) {
        res.status(error.status || 400).send({...error, message: error.message || `Error in userModifyInfoRoute() for user ${userID} updating info ${infoID} in DB!`});
    }
};

let getCloudStorageReadURLRoute = async (req, res) => {
    const userID = req.user.userID;
    const bucketFileName = req.params.bucketfilename;
    let url;
    try {
        url = await getV4ReadSignedUrl(userID, bucketFileName);
    } catch (error) {
        res.status(error.status || 400).send({...error, message: error.message});
    }
    res.status(201).send({url});
};

let calculateExpenseSummary = (infoRecords) => {
    let expenseSummary = {
        expenseSum: 0,
        years: {}
    };
    for (const record of infoRecords) {
        const date = record.analyzedResults.invoice_date || record.dateAdded.toISOString().substring(0, 10);
        const year = parseInt(date.substring(0, 4));
        const month = parseInt(date.substring(5, 7));
        const expense = parseFloat(record.analyzedResults.total_amount || 0) || 0;
        expenseSummary['expenseSum'] += expense;
        if (! expenseSummary['years'][year]) {
            expenseSummary['years'][year] = {
                yearlyExpenseSum: 0,
                months: {}
            };
        }
        expenseSummary['years'][year]['yearlyExpenseSum'] += expense;
        if (! expenseSummary['years'][year]['months'][month]) {
            expenseSummary['years'][year]['months'][month] = {
                monthlyExpenseSum: 0,
            };
        }
        expenseSummary['years'][year]['months'][month]['monthlyExpenseSum'] += expense;
    }
    return expenseSummary;
};

function isNumericOrNull(str) {
    if (str === null) return true;
    return !isNaN(str) && !isNaN(parseFloat(str));
};

let infoRouter = express.Router();

infoRouter.route('/')
    .get(requireAuth, userGetAllInfoRoute)
    .post(requireAuth, jsonBodyParser, bucketFileNameChecker, fileTypeChecker, userAddInfoRoute)
    .patch(requireAuth, jsonBodyParser, bucketFileNameChecker, modifiedInfoContentFilter, userModifyInfoRoute);

infoRouter.route('/:info_id')
    .get(requireAuth, userGetInfoRoute)
    .delete(requireAuth, userRemoveInfoRoute)
    .patch(requireAuth, jsonBodyParser, modifiedInfoContentFilter, userModifyInfoRoute);

infoRouter.route('/static/:bucketfilename')
    .get(requireAuth, getCloudStorageReadURLRoute);


module.exports = infoRouter;