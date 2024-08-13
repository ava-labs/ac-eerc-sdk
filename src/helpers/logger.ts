// logs a message with a timestamp
export const logMessage = (msg: string) => {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] : ${msg}`);
};
