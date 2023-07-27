const {Storage} = require('@google-cloud/storage');

const storage = new Storage({
    keyFilename: path.join(__dirname, '../credentials/dulcet-essence-388620-d1f083476c7a.json'),
    projectId: 'dulcet-essence-388620'
});

storage.getBuckets.then(x => console.log(x));