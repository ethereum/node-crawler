import { Box, BoxProps, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, forwardRef, HStack, Input, Select, StackProps, Text, useColorModeValue, useDisclosure, VStack } from "@chakra-ui/react"
import React, { useCallback, useRef } from "react";
import { useState } from "react";
import { useEffect } from "react";
import { VscCheck, VscClose, VscFilter } from "react-icons/vsc"
import { FilterGroup, FilterOperatorToSymbol, FilterItem, FilterOperator, Filter } from "../data/FilterTypes";

interface EditableProps extends StackProps {
  item: FilterItem
  editMode?: boolean
  showRemoveButton?: boolean
  onRemoveClicked: () => void
  onSaveClicked: (item: FilterItem) => void
}

const EditableInput: React.FC<EditableProps> = forwardRef<EditableProps, 'div'>((props: EditableProps, ref: React.ForwardedRef<any>) => {
  const {
    item,
    editMode,
    showRemoveButton,
    onRemoveClicked,
    onSaveClicked,
    ...rest
  } = props

  const [editItem, setEditItem] = useState<Filter>(item || { name: 'name', 'operator': 'eq', value: '' })
  const [editing, setEditing] = useState(editMode || item === undefined || !item)

  useEffect(() => {
    if (item) {
      setEditItem(item)
    }
  }, [item])
  
  if (editing) {
    return (
      <VStack borderWidth="thick" borderStyle="dashed" rounded="lg" p="2" ref={ref} {...rest}>
        <Select size="xs" value={editItem.name} onChange={(e) => setEditItem(item => ({...item, name: e.target.value}))}>
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
        <Select size="xs" value={editItem.operator} onChange={(e) => setEditItem(item => ({...item, operator: e.target.value as FilterOperator}))}>
          <option value="eq">=</option>
          <option value="lt">&lt;</option>
          <option value="lte">&lt;=</option>
          <option value="gt">&gt;</option>
          <option value="gte">&gt;=</option>
          <option value="not">!=</option>
        </Select>
        <Input size="xs" value={editItem.value} onChange={(e) => setEditItem(item => ({...item, value: e.target.value}))} />
        <HStack>
          <Button variant="ghost" iconSpacing={0} size="sm" leftIcon={<VscCheck />} title="Save condition" onClick={() => onSaveClicked(editItem)} />
          {showRemoveButton && (<Button variant="ghost" iconSpacing={0} size="sm" leftIcon={<VscClose />} title="Remove condition" onClick={() => onRemoveClicked()} />)}
        </HStack>
      </VStack>
    )
  }

  return (
    <HStack borderWidth="thin" borderStyle="dashed" rounded="lg" p="2" ref={ref} {...rest}>
      <Text fontWeight="bold">{editItem.name}</Text>
      {editItem.operator && (<Text>{FilterOperatorToSymbol[editItem.operator]}</Text>)}
      <Text>{editItem.value}</Text>
      {onRemoveClicked && (<Button variant="ghost" iconSpacing={0} size="sm" leftIcon={<VscClose />} title="Remove condition" onClick={() => onRemoveClicked()} />)}
    </HStack>
  )
})

interface FilteringProps extends BoxProps {
  filters?: FilterGroup[]
}

export const Filtering: React.FC<FilteringProps> = forwardRef<FilteringProps, 'div'>((props: FilteringProps, ref: React.ForwardedRef<any>) => {
  const color = useColorModeValue("teal.100", "teal.700")
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef: React.RefObject<any> = useRef()

  const [filters, setFilters] = React.useState<FilterGroup[]>(props.filters || [])
  const [totalFilters, setTotalFilters] = React.useState(props.filters?.length || 0)

  useEffect(() => {
    setTotalFilters(filters.reduce((prev, curr) => prev + curr.length, 0) || 0)
  }, [filters])

  const onApply = () => {
  }

  const removeFilter = useCallback((groupIndex: number, filterIndex?: number) => {
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

      if (group.length === 0) {
        newGroupFilters.splice(groupIndex, 1)
      } else {
        newGroupFilters[groupIndex] = group
      }
      return newGroupFilters
    })
  }, [])

  const addFilter = useCallback((groupIndex?: number) => {
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
  }, [])

  const saveFilter = useCallback((filter: FilterItem, groupIndex?: number, filterIndex?: number) => {
    console.log("saveFilter", filter, groupIndex, filterIndex)
  }, [])

  const filterText = totalFilters > 0 ? `${totalFilters} filters applied` : "Apply filter"

  return (
    <>
      <HStack {...props} justifyContent='flex-end'>
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
            {filters.length > 0 && filters.map((filterGroup: FilterGroup, groupIndex: number) => (
              <Box key={groupIndex}>
                <VStack borderWidth="medium" borderStyle="dashed" borderColor={color} rounded="lg" p="4">
                  {filterGroup.map((filter: FilterItem, filterIndex: number) => (
                    <Box key={filterIndex}>
                      <EditableInput
                        borderColor={color}
                        item={filter}
                        onRemoveClicked={() => removeFilter(groupIndex, filterIndex)}
                        onSaveClicked={(item: FilterItem) => saveFilter(item, groupIndex, filterIndex)}
                        showRemoveButton={filterGroup.length > 1}
                      />
                      {filterIndex < filterGroup.length - 1 && <Text fontSize="14px">and</Text>}
                    </Box>
                  ))}
                  <HStack>
                    <Button colorScheme="teal" size="xs" variant="ghost" onClick={() => removeFilter(groupIndex)}>Remove filter</Button>
                    <Button colorScheme="teal" size="xs" variant="ghost" onClick={() => addFilter(groupIndex)}>Add condition</Button>
                  </HStack>
                </VStack>
                {groupIndex < filters.length - 1 && <Text fontSize="14px" m="4">or</Text>}
              </Box>
            ))}
            <Button mt="4" colorScheme="teal" size="xs" variant="ghost" onClick={() => addFilter()}>Add filter</Button>
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