import React, { useState, useEffect } from 'react';
import axios from 'axios';
import URL from '../config/URLConfig';
import { DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Table as UITable,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  TableCaption,
} from '@chakra-ui/react';
import TableItem from './TableItem';

export default function Table({ setImg, info, onAmount }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function getDocs() {
      const extractedData = info.map((info) => ({
        amount: info.analyzedResults.AMOUNT,
        calories: info.analyzedResults.CALORIES,
        carbonhydrate: info.analyzedResults.CARBOHYDRATE,
        fat: info.analyzedResults.FAT,
        protein: info.analyzedResults.PROTEIN,
        sodium: info.analyzedResults.SODIUM,
        date: new Date(info.dateAdded).toLocaleDateString(),
        fileName: info.fileName,
        url: (
          <img
            src={info.imageURL}
            alt="info photo"
            onClick={() => setImg(info.imageURL)}
            width="200"
            height="200"
          />
        ),
        id: info._id,
        multiplier: localStorage.getItem(info.fileName.toString()) || 1, // Default multiplier is set to 1
      }));
      setData(extractedData);
    }
    getDocs();
  }, [info, setImg]);

  useEffect(() => {
    if (!data) return;
    const totalCalories = data.reduce(
      (pre, curr) => pre + Number(curr.calories * curr.multiplier),
      0,
    );
    onAmount(totalCalories);
  }, [onAmount, data]);

  function handleMultiplierChange(itemId, multiplier) {
    setData((prevData) =>
      prevData.map((item) => (item.id === itemId ? { ...item, multiplier } : item)),
    );
  }

  const dataTable =
    data == null ? (
      <></>
    ) : (
      data.map((item) => (
        <TableItem item={item} key={item.id} onMultiplierChange={handleMultiplierChange} />
      ))
    );

  return (
    data && (
      <TableContainer>
        <UITable variant="striped" size="sm">
          <Thead>
            <Tr>
              <Th>Food</Th>
              <Th>Date</Th>
              <Th>Unit</Th>
              <Th>Calories (cal)</Th>
              <Th>Carbonhydrate (g)</Th>
              <Th>Fat (g)</Th>
              <Th>Protein (g)</Th>
              <Th>Sodium (mg)</Th>
              <Th>Image</Th>
              <Th>Delete</Th>
              <Th>Multiplier</Th>
            </Tr>
          </Thead>
          <Tbody>{dataTable}</Tbody>
        </UITable>
      </TableContainer>
    )
  );
}
