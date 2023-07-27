import { Card, Heading, Flex } from '@chakra-ui/react';

const TotalCalories = ({ amount }) => {
  const month = new Date().toLocaleDateString();

  return (
    <>
      <Card size="lg" align="center" bg="#f25d9c" mt="8" mb="8">
        <Heading m="12" fontSize="5xl" as="b" size="lg" color="#09044A">
          {amount} CAL
        </Heading>
      </Card>
    </>
  );
};

export default TotalCalories;
