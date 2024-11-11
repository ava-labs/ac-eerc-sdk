/**
 * logs a message with a timestamp and a prefix
 * @param msg message
 */
export const logMessage = (msg: string) => {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] : ${msg}`);
};
