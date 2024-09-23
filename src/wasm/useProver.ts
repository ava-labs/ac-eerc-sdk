import { useCallback, useEffect, useRef } from "react";
import { type IWasmProof, logMessage } from "../helpers";
import { wasmExecBase64 } from "./worker";

export const useProver = () => {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Define the inline worker script
    const script = `
      importScripts('https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako.min.js');

      const wasmExecScript = atob('${wasmExecBase64}');
      const blob = new Blob([wasmExecScript], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      importScripts(url);

      self.onmessage = async function(e) {
        const { wasmUrl, funcArgs, proofType } = e.data;

        try {
          // Initialize a new Go runtime for every proof generation
          const go = new Go();
          let wasm = null;

          // fetch wasm url and decompress it and instantiate it
          if (proofType == "TRANSFER") {
            const response = await fetch(wasmUrl);
            const compressed = new Uint8Array(await response.arrayBuffer());
            const decompressed = pako.inflate(compressed);
            const wasmModule = await WebAssembly.instantiate(decompressed, go.importObject);
            wasm = wasmModule.instance;    
          } else {
              const resp = await fetch(wasmUrl);
              const bytes = await resp.arrayBuffer();
              const rr = await WebAssembly.instantiate(bytes, go.importObject);
              wasm = rr.instance;
          }

          go.run(wasm);


          let result;
          switch (proofType) {
            case 'REGISTER':
              result = generateRegisterProof(funcArgs);
              break;
            case 'MINT':
              result = generateMintProof(funcArgs);
              break;
            case 'BURN':
              result = generateBurnProof(funcArgs);
              break;
            case 'TRANSFER':
              result = generateTransferProof(funcArgs);
              break;
            default:
              throw new Error('Invalid proof type');
          }

          self.postMessage(result);
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

  // Memoize the prove function using useCallback
  const prove = useCallback(
    async (
      data: string,
      proofType: "REGISTER" | "MINT" | "BURN" | "TRANSFER",
    ): Promise<IWasmProof> => {
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
            resolve(JSON.parse(event.data) as IWasmProof);
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
          wasmUrl:
            proofType.toLowerCase() === "transfer"
              ? `${location.origin}/transfer_prover.wasm`
              : `${location.origin}/register_mint_prover.wasm`,
          funcArgs: data,
          proofType,
        });
      });
    },
    [],
  );

  return {
    prove,
  };
};
