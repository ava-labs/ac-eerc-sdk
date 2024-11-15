import { useCallback, useEffect, useRef } from "react";
import { type IProof, logMessage } from "../helpers";
import { wasmExecBase64 } from "./worker";

type useProverProps = {
  transferURL: string;
  multiWasmURL: string;
};

export const useProver = ({ transferURL, multiWasmURL }: useProverProps) => {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Define the inline worker script
    const script = `
      const wasmExecScript = atob('${wasmExecBase64}');
      const blob = new Blob([wasmExecScript], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      importScripts(url);

      self.onmessage = async function(e) {
        const { wasmUrl, funcArgs, proofType } = e.data;

        try {
          const go = new Go();
          let wasm = null;

          // Check if Wasm is already instantiated and cached
          if ('instantiateStreaming' in WebAssembly) {
            const result = await WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject);
            wasm = result.instance;
          } else {
            const resp = await fetch(wasmUrl);
            const bytes = await resp.arrayBuffer();
            const result = await WebAssembly.instantiate(bytes, go.importObject);
            wasm = result.instance;
          }

          go.run(wasm);
          const proof = generateProof(proofType, funcArgs);
          self.postMessage(proof);

        } catch (error) {
          console.log('Error:', error);
          self.postMessage({ error: "Error generating proof" });
        }
      };
    `;

    // Create a Blob from the worker script
    const blob = new Blob([script], { type: "application/javascript" });

    // Create a URL for the Blob
    const workerUrl = URL.createObjectURL(blob);

    // Initialize the Worker and store it in the workerRef
    workerRef.current = new Worker(workerUrl);

    // Cleanup when the component is unmounted or effect is re-run
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  /**
   * generate proof by using the wasm module
   * @param data - data to generate proof
   * @param proofType - proof type
   * @returns proof
   */
  const prove = useCallback(
    async (
      data: string,
      proofType: "REGISTER" | "MINT" | "WITHDRAW" | "TRANSFER",
    ): Promise<IProof> => {
      if (!workerRef.current) {
        throw new Error("Worker not initialized");
      }

      // Start performance measurement
      const startTime = performance.now();

      // Return a promise that resolves when the worker completes
      return new Promise((resolve, reject) => {
        // Define the message handler
        const handleWorkerMessage = (event: MessageEvent) => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          logMessage(`Proof generation took ${duration.toFixed(2)} ms`);

          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            // resolve(JSON.parse(event.data) as WasmProof);
            const proof = JSON.parse(event.data) as {
              a: string[];
              b: string[][];
              c: string[];
            };
            resolve({
              proof: [...proof.a, ...proof.b.flat(), ...proof.c],
            });
          }

          // Remove the event listener after the message is received
          workerRef.current?.removeEventListener(
            "message",
            handleWorkerMessage,
          );
        };

        // Add a one-time event listener for the worker response
        workerRef.current?.addEventListener("message", handleWorkerMessage);

        // Send the necessary data to the worker
        workerRef.current?.postMessage({
          wasmUrl: proofType === "TRANSFER" ? transferURL : multiWasmURL,
          funcArgs: data,
          proofType,
        });
      });
    },
    [transferURL, multiWasmURL], // Only recreate the function when `url` changes
  );

  return {
    prove,
  };
};
