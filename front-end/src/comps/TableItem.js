import { DeleteIcon } from "@chakra-ui/icons";
import { Button, Select, Td, Tr } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import URL from '../config/URLConfig';

const TableItem = ({ item, onMultiplierChange }) => {
  const [multiplier, setMultiplier] = useState(
    localStorage.getItem(item.fileName) || 1
  );

  async function deleteRequest(id) {
    try {
      const JWT = sessionStorage.getItem("nutritionAnalysisCredential");
      await axios.delete(URL + "info/" + id, {
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
      });
      alert("Info removed successfully!");
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      alert(error.message);
    }
  }

  //   function handleMultiplierChange(id, multiplier) {
  //     setData((prevData) =>
  //       prevData.map((item) => (item.id === id ? { ...item, multiplier } : item))
  //     );
  //   }

  function handleDelete(id) {
    deleteRequest(id);
  }

  const calculatedCalories = item.calories? (item.calories * multiplier) : "0";
  const calculatedCarbonhydrate = item.carbonhydrate? (item.carbonhydrate.replace("g", "") * multiplier): "-";
  const calculatedFat = item.fat? (item.fat.replace("g", "") * multiplier) : "-";
  const calculatedProtein = item.protein? (item.protein.replace("g", "") * multiplier) : "-";
  const calculatedSodium = item.sodium? (item.sodium.replace("mg", "") * multiplier) : "-";

  useEffect(() => {
    localStorage.setItem(item.fileName.toString(), multiplier);
    onMultiplierChange(item.id, multiplier); 
  }, [item.fileName, multiplier]);


  return (
    <Tr key={item.id}>
      {console.log(item.fileName)}
      <Td>{item.fileName.split(".")[0]}</Td>
      <Td>{item.date.substring(0, 10)}</Td>
      <Td>{item.amount || "-"}</Td>
      <Td>{calculatedCalories}</Td>
      <Td>{calculatedCarbonhydrate}</Td>
      <Td>{calculatedFat}</Td>
      <Td>{calculatedProtein}</Td>
      <Td>{calculatedSodium}</Td>
      <Td>{item.url}</Td>
      <Td>
        <Button
          colorScheme="red"
          variant="outline"
          onClick={() => handleDelete(item.id)}
        >
          <DeleteIcon />
        </Button>
      </Td>
      <Td>
        <Select
          value={multiplier}
          onChange={(e) => setMultiplier(Number(e.target.value))}
        >
          <option value={1}>x1</option>
          <option value={2}>x2</option>
          <option value={3}>x3</option>
        </Select>
      </Td>
    </Tr>
  );
};

export default TableItem;
