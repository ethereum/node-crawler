import React, { createContext, useContext, useEffect, useState } from 'react';
import { Loader } from '../organisms/Loader';
import { ClientApiResponse, ClientDatabase, ClientsProcessor, EmptyDatabase, LoadingResponse } from './DataProcessor';

interface DataContextType extends ClientDatabase {
  isReady: boolean
}


const DataContext = createContext<DataContextType>({
  isReady: false,
  ...EmptyDatabase
})

const useData = () => useContext(DataContext);

const DataProvider = ({
  children,
  url,
}: {
  children: React.ReactNode
  url: string
}) => {
  const [data, setData] = useState<DataContextType>({
    isReady: false,
    ...EmptyDatabase
  })

  useEffect(() => {
    if (!url)
      return;

    const onErrorRecieved = (entity: string, data: string, raw: string) => console.error(entity, data, raw)

    const run = async () => {
       const response = await fetch(url);
       const jsonResponse : ClientApiResponse[] | LoadingResponse = await response.json()

       
      if ((jsonResponse as LoadingResponse).status === 'loading') {
        return;
      }

      const rawClients = jsonResponse as ClientApiResponse[]
      const db = ClientsProcessor(rawClients, onErrorRecieved)
      setData({...db, isReady: true})
    }

    run()

    return () => {}
  }, [url])

  return (
    <DataContext.Provider value={data}>
      {data.isReady ? children : <Loader>loading data</Loader>}
    </DataContext.Provider>
  )
}

export { useData, DataProvider }