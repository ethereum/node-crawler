import { Center, VStack, Text } from '@chakra-ui/react';
import React from 'react';
import { Logo } from '../atoms/Logo';

interface LoaderProps {
  children: React.ReactNode;
}

export function Loader(props: LoaderProps) {
  return (
    <Center h="100vh" color="brand.primaryText">
      <VStack>
        <Logo width={100} height={100}/>
        <Text>{props.children}</Text>
      </VStack>
    </Center>
  );
}