import { Box, BoxProps, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, forwardRef, HStack, Icon, Input, Select, StackProps, Text, useColorModeValue, useDisclosure, VStack } from "@chakra-ui/react"
import React, { useRef } from "react";
import { useState } from "react";
import { useEffect } from "react";
import { VscClose, VscFilter } from "react-icons/vsc"

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

export type FilterItem = Filter | undefined
export type FilterGroup = FilterItem[];

export const ParseAndValidateFilters = (locationSearch: string): FilterGroup[] => {
  const rawFilters = new URLSearchParams(locationSearch).get('filter')
  if (!rawFilters) {
    return []
  }

  try {
    const parsedFilters: [string[]] = JSON.parse(rawFilters)
    if (!Array.isArray(parsedFilters)) {
      throw Error(`Invalid filters: ${rawFilters}`)
    }

    const filterGroup: FilterGroup[] = parsedFilters.map((unparsedFilters, idx) => {
      if (!Array.isArray(unparsedFilters)) {
        throw Error(`Invalid filter, item "${idx}" should be an array`)
      }

      return unparsedFilters.map((unparsedFilter, unparsedIdx) => {
        if (typeof unparsedFilter !== "string") {
          throw Error(`Invalid filter, item "${idx}" at "${unparsedIdx}" should be an array`)
        }

        const [name, value, operator] = unparsedFilter.split(":")
        if (operator && !(operator in FilterOperatorToSymbol)) {
          throw Error(`Invalid operator, item "${idx}" at "${unparsedIdx}" is invalid: ${operator}`)
        }

        if (!name && !value) {
          throw Error(`Invalid key/value, item "${idx}" at "${unparsedIdx}" is missing: ${name} and ${value}`)
        }

        return { name, value, operator } as Filter
      })
    })
    
    return filterGroup
  } catch (e) {
    throw Error(`Cannot parse filters: '${rawFilters}'. Reason: ${e}`)
  }
}

interface EditableProps extends StackProps  {
  item: FilterItem
  showRemoveButton?: boolean
  onRemoveClicked: () => void
}

const EditableInput: React.FC<EditableProps> = forwardRef<EditableProps, 'div'>((props: EditableProps, ref: React.ForwardedRef<any>) => {
  const [editMode, setEditMode] = useState(props.item === undefined)
  const {
    item,
    showRemoveButton,
    onRemoveClicked,
    ...rest
  } = props


  if (editMode || !item) {
    return (
      <HStack borderWidth="thin" borderStyle="dashed" rounded="lg" p="2" {...rest}>
        <Select placeholder="Select key" defaultValue="name" size="xs">
          <option value="name">Client Name</option>
          <option value="major">Version (major)</option>
          <option value="minor">Version (minor)</option>
          <option value="patch">Version (patch)</option>
          <option value="tag">Version (tag)</option>
          <option value="build">Version (build)</option>
          <option value="date">Version (date)</option>
          <option value="os">Operating System</option>
          <option value="architecture">Architecture</option>
          <option value="language">Language Runtime</option>
        </Select>
        <Select defaultValue="eq" size="xs">
          <option value="eq">=</option>
          <option value="lt">&lt;</option>
          <option value="lte">&lt;=</option>
          <option value="gt">&gt;</option>
          <option value="gte">&gt;=</option>
          <option value="not">!=</option>
        </Select>
        <Input size="xs" />
        {showRemoveButton && (<Icon as={VscClose} _hover={{color: "black"}} cursor="pointer" onClick={() => onRemoveClicked()}/>)}
      </HStack>
    )
  }

  return (
    <HStack borderWidth="thin" borderStyle="dashed" rounded="lg" p="2" {...rest}>
      <Text fontWeight="bold">{item.name}</Text>
      {item.operator && (<Text>{FilterOperatorToSymbol[item.operator]}</Text>)}
      <Text>{item.value}</Text>
      {onRemoveClicked && (<Icon as={VscClose} _hover={{color: "black"}} cursor="pointer" onClick={() => onRemoveClicked()}/>)}
    </HStack>
  )
})

interface FilteringProps extends BoxProps  {
  filters?: FilterGroup[]
}

export const Filtering: React.FC<FilteringProps> = forwardRef<FilteringProps, 'div'>((props: FilteringProps, ref: React.ForwardedRef<any>) => {
  const color = useColorModeValue("teal.100", "teal.700")
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef: React.RefObject<any> = useRef()

  const [modifyState, setModifyState] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterGroup[]>(props.filters || [])
  const [totalFilters, setTotalFilters] = React.useState(0)

  useEffect(() => {
    setTotalFilters(filters.reduce((prev, curr) => prev + curr.length, 0) || 0)
  }, [filters])

  const onApply = () => {
    setModifyState(false)
  }

  const removeFilter = (groupIndex: number, filterIndex?: number) => {
    if (filterIndex === undefined) {
      setFilters(groupFilters => {
        const newGroupFilters = [...groupFilters]
        newGroupFilters.splice(groupIndex, 1)
        return newGroupFilters
      })
      return
    }

    setFilters(groupFilters => {
      const newGroupFilters = [...groupFilters]
      const group: FilterGroup = [...groupFilters[groupIndex]]
      group.splice(filterIndex, 1)
      newGroupFilters[groupIndex] = group
      return newGroupFilters
    })
  }

  const addFilter = (groupIndex?: number) => {
    if (groupIndex === undefined) {
      setFilters(groupFilters => {
        const newGroupFilters = [...groupFilters]
        newGroupFilters.push([undefined])
        return newGroupFilters
      })
      return
    }

    setFilters(groupFilters => {
      const newGroupFilters = [...groupFilters]
      const group: FilterGroup = [...groupFilters[groupIndex]]
      group.push(undefined)
      newGroupFilters[groupIndex] = group 
      return newGroupFilters
    })
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
                {filters.length > 0 && filters.map((filterGroup: FilterGroup, groupIndex: number) => (
                  <Box key={groupIndex}>
                    <VStack borderWidth="medium" borderStyle="dashed" borderColor={color} rounded="lg" p="4">
                      {filterGroup.map((filter: FilterItem, filterIndex: number) => (
                        <Box key={filterIndex}>
                          <EditableInput borderColor={color} item={filter} onRemoveClicked={() => removeFilter(groupIndex, filterIndex)} showRemoveButton={filterGroup.length > 1} />
                          {filterIndex < filterGroup.length - 1 && <Text fontSize="14px">and</Text>}
                        </Box>
                      ))}
                      <HStack>
                        <Button colorScheme="teal" size="xs" variant="ghost" onClick={() => removeFilter(groupIndex)}>Remove filter</Button>
                        <Button colorScheme="teal" size="xs" variant="ghost" onClick={() => addFilter(groupIndex)}>Add condition</Button>
                      </HStack>
                    </VStack>
                    {groupIndex < filters.length - 1 && <Text fontSize="14px"m="4">or</Text>}
                  </Box>
                ))}
                <Button mt="4" colorScheme="teal" size="xs" variant="ghost" onClick={() => addFilter()}>Add filter</Button>
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