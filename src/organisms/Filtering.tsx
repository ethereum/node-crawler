import { BoxProps, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, forwardRef, HStack, Icon, Text, useColorModeValue, useDisclosure, VStack } from "@chakra-ui/react"
import React, { useRef } from "react";
import { useEffect } from "react";
import { VscClose, VscFilter } from "react-icons/vsc"

interface FilteringProps extends BoxProps  {
  filters?: FilterGroup[];
}

export type FilterOperator = "eq" | "not" | "lt" | "lte" | "gt" | "gte"

const FilterOperatorToSymbol = {
  "eq": "=",
  "not": "!=",
  "lt": "<",
  "lte": "<=",
  "gt": ">",
  "gte": ">="
}

export interface Filter {
  name: string;
  value: string;
  operator?: FilterOperator;
}

export type FilterGroup = Filter[];

export const Filtering: React.FC<FilteringProps> = forwardRef<FilteringProps, 'div'>((props: FilteringProps, ref: React.ForwardedRef<any>) => {
  const color = useColorModeValue("teal.100", "teal.700")
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef: React.RefObject<any> = useRef()

  const [modifyState, setModifyState] = React.useState(false)
  const [filters,] = React.useState(props.filters)
  const [totalFilters, setTotalFilters] = React.useState(0)

  useEffect(() => {
    setTotalFilters(filters?.reduce((prev, curr) => prev + curr.length, 0) || 0)
  }, [filters])

  const addNewGroupItem = () => {
    setModifyState(true)
  }

  const onApply = () => {
    setModifyState(false)
  }

  const filterText = totalFilters > 0 ? `${totalFilters} filters applied` : "Apply filter"

	return (
    <>
    <HStack {...props}>
      <Button ref={btnRef} leftIcon={<VscFilter />} variant="ghost" onClick={onOpen}>{filterText}</Button>
    </HStack>
    <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filters</DrawerHeader>
          <DrawerBody textAlign="center">
            {modifyState && (
              <>modify</>
            )}
            {!modifyState && (
              <>
                {filters && filters.map((filterGroup: FilterGroup, groupIndex: number) => (
                  <>
                    <VStack borderWidth="medium" borderStyle="dashed" borderColor={color} rounded="lg" p="4">
                      {filterGroup.map((filter: Filter, filterIndex: number) => (
                        <>
                          <HStack borderWidth="thin" borderStyle="dashed" borderColor={color} rounded="lg" p="2">
                            <Text fontWeight="bold">{filter.name}</Text>
                            {filter.operator && (<Text>{FilterOperatorToSymbol[filter.operator]}</Text>)}
                            <Text>{filter.value}</Text>
                            {filterGroup.length > 1 && (<Icon as={VscClose} _hover={{color: "black"}} cursor="pointer" />)}
                          </HStack>
                          {filterIndex < filterGroup.length - 1 && <Text fontSize="14px">and</Text>}
                        </>
                      ))}
                      <HStack>
                        <Button colorScheme="teal" size="xs" variant="ghost">Remove</Button>
                        <Button colorScheme="teal" size="xs" variant="ghost">Add</Button>
                      </HStack>
                    </VStack>
                    {groupIndex < filters.length - 1 && <Text fontSize="14px"m="4">or</Text>}
                  </>
                ))}
                <Button mt="4" colorScheme="teal" size="xs" variant="ghost" onClick={() => addNewGroupItem()}>Add another OR condition</Button>
              </>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} colorScheme="teal" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={onApply}>Apply</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
	)
})