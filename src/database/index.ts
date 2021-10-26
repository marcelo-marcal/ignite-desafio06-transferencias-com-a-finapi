import { Connection, createConnection, getConnectionOptions } from "typeorm";

export default async (host = "fin_api_database"): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();

  return createConnection(
    Object.assign(defaultOptions, {
      host: process.env.NODE_ENV === "test" ? "localhost" : host,
      database:
        process.env.NODE_ENV === "test"
          ? "fin_api_test"
          : defaultOptions.database,
    })
  );
};

// export default async (): Promise<Connection> => {
//   const defaultOptions = await getConnectionOptions();

//   return createConnection(
//     Object.assign(defaultOptions, {
//       database:
//         process.env.NODE_ENV === 'test'
//           ? 'fin_api_test'
//           : defaultOptions.database,
//     })
//   );
// };