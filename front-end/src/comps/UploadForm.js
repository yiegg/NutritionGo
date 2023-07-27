import React from 'react';
import { useState } from 'react';
import { Alert, Button, Form } from '@chakra-ui/react';
import ProgressBar from './ProgressBar';

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

  const types = ['image/png', 'image/jpeg'];

  const uploadImage = () => {
    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = (_) => {
      // you can use this method to get file and perform respective operations
      let files = Array.from(input.files);
      let selected = files[0];
      console.log(selected);

      if (selected && types.includes(selected.type)) {
        setFile(selected);
        setError('');
      } else {
        setFile(null);
        setError('Please select an image (png or jpeg)');
      }
    };
    input.click();
  };

  return (
    <form mb="8">
      <Button
        color="#fff"
        bg="#f25d9c"
        _hover={{ bg: '#ee2e7f' }}
        variant="solid"
        component="label"
        onClick={uploadImage}
        mb="8"
      >
        Upload a picture
      </Button>
      <span>{status}</span>
      <div className="output">
        {error && <Alert severity="warning">{error}</Alert>}
        {file && <div className="file">{file.name}</div>}
        {file && <ProgressBar file={file} setFile={setFile} setStatus={setStatus} />}
      </div>
    </form>
  );
}
