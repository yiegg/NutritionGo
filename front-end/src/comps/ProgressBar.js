import { Box } from '@chakra-ui/react';
import { Progress } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import axios from 'axios';
import URL from '../config/URLConfig';

export default function ProgressBar({ file, setFile, setStatus }) {
  // TO-DO replace with real post HTTP request
  async function uploadInfo(info) {
    try {
      setStatus('Uploading info~');
      const JWT = sessionStorage.getItem('nutritionAnalysisCredential');
      const storageInfo = await axios.get(URL + 'uploads/static/' + info.name, {
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
      });
      const bucketFileName = storageInfo.data.bucketFileName;
      const url = storageInfo.data.url;

      let uploadRes = await axios.put(url, info, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      setStatus('AI analyzing info~');
      let analyzeRes = await axios.post(
        URL + 'info/',
        { bucketFileName: bucketFileName, fileType: 'png' },
        {
          headers: {
            Authorization: `Bearer ${JWT}`,
            ContentType: 'application/json',
          },
        },
      );
      setFile(null);
      alert('New info added successfully!');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      alert(error.message);
    }
  }

  useEffect(() => {
    uploadInfo(file);
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <Progress isIndeterminate />
    </Box>
  );
}
