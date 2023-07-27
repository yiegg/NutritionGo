import { useEffect, useState } from 'react';
import TotalCalories from './TotalCalories';
import UploadForm from './UploadForm';
import Table from './Table';
import Modal from './Modal';
import URL from '../config/URLConfig';
import axios from 'axios';
import { Button, Flex, Box, Divider, Heading, Spacer, Center, Image } from '@chakra-ui/react';
import Logo from '../static/logo.jpg';

function Home() {
  const [img, setImg] = useState(null);
  const [info, setInfo] = new useState([]);
  const [amount, setAmount] = new useState(0);

  async function fetchRecords() {
    const JWT = sessionStorage.getItem('nutritionAnalysisCredential');
    const rawRecords = await axios.get(URL + 'info', {
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
    });
    setInfo(rawRecords.data.infoRecords);
    // setAmount(rawRecords.data.expenseSummary.expenseSum);
  }

  const handleLogout = () => {
    sessionStorage.removeItem('nutritionAnalysisCredential');
    window.location.href = '/Login';
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    console.log(info);
  }, [info]);

  return (
    info && (
      <Flex w={'100%'} p={10} alignContent={'center'} justifyContent={'center'}>
        <Flex w={'80%'} direction={'column'} alignContent={'center'} justifyContent={'center'}>
          <Divider />
          <Flex minWidth="max-content" alignItems="center" gap="2">
            <Box p="2">
              <Flex alignItems="center">
                <Image boxSize="39" src={Logo} alt="logo" mr="1" />
                <Heading color="#09044A" size="2xl">
                  Nutrition Analysis
                </Heading>
              </Flex>
            </Box>
            <Spacer />
            <Button size="lg" color="#f25d9c" onClick={handleLogout}>
              Sign Out
            </Button>
          </Flex>
          <Divider />
          <TotalCalories amount={amount} />
          <UploadForm />

          <Table setImg={setImg} info={info} onAmount={setAmount} />

          {img && <Modal src={img} setImg={setImg} />}
        </Flex>
      </Flex>
    )
  );
}

export default Home;
