type EmscriptenModule = (options: {
  arguments: string[];
  print: (text: string) => void;
  printErr: (text: string) => void;
  preRun: ((mod: any) => void)[];
  onExit: (code: number) => void;
  onAbort: (reason: any) => void;
  postRun: ((mod: any) => void)[];
  exit: (code: number, reason?: any) => void;
  // The 'run' function in the generated JS expects individual arguments,
  // not an array. The `callMain` property is a placeholder for the type.
  callMain: (args: string[]) => void;
}) => Promise<{ FS: any; callMain: (args: string[]) => void; preRun: any[] }>;

interface EmscriptenRunResult {
  stdout: string[];
  stderr: string[];
  files: Record<string, File>;
}

/**
 * Runs an Emscripten module with specified input files and arguments,
 * and retrieves the output files.
 *
 * @param moduleLoader - The Emscripten module loader function.
 * @param inputFiles - An array of files to be written to the virtual filesystem.
 * @param args - Command-line arguments for the module.
 * @param outputPaths - An array of paths to read from the virtual filesystem after execution.
 * @returns An object containing stdout, stderr, and the retrieved files.
 */
export const runEmscripten = async (
  moduleLoader: EmscriptenModule,
  inputFiles: { path: string; data: ArrayBuffer }[],
  args: string[],
  outputPaths: string[],
): Promise<EmscriptenRunResult> => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const outputFiles: Record<string, File> = {};
  let module: any;

  // Define preRun logic beforehand
  const preRun = [
    (mod: any) => {
      // Write input files
      for (const file of inputFiles) {
        const dir = file.path.substring(0, file.path.lastIndexOf("/"));
        if (dir) {
          mod.FS.mkdirTree(dir);
        }
        mod.FS.writeFile(file.path, new Uint8Array(file.data));
      }

      // Create output directories if -o is used
      const outputDirIndex = args.indexOf("-o");
      if (outputDirIndex > -1) {
        mod.FS.mkdirTree(args[outputDirIndex + 1]);
      }
    },
  ];

  try {
    await new Promise<void>(async (resolve, reject) => {
      module = await moduleLoader({
        arguments: args,
        preRun: preRun,
        postRun: [],
        print: (text: string) => {
          console.log("emscripten stdout:", text);
          stdout.push(text);
        },
        printErr: (text: string) => {
          console.warn("emscripten stderr:", text);
          stderr.push(text);
        },
        onExit: (code) => {
          if (code === 0) {
            resolve();
          } else {
            const errorMessage = stderr.join("\n");
            reject(new Error(`Emscripten module exited with code ${code}:\n${errorMessage}`));
          }
        },
        onAbort: (reason) => {
          const errorMessage = stderr.join("\n");
          reject(new Error(`Emscripten module aborted: ${reason}\n${errorMessage}`));
        },
        exit: (code: number) => { }, // Dummy exit function to satisfy the type
        // This is a placeholder. The module loader will call the C main function automatically.
        callMain: (args: string[]) => { },
      });

    });
  } catch (e) {
    // This will catch errors from onExit/onAbort and re-throw them
    throw e;
  }

  // By the time we get here, the Emscripten module has finished running.
  // Now we can safely read the output.
  for (const path of outputPaths) {
    try {
      const data: Uint8Array | undefined = module.FS.readFile(path, { encoding: 'binary' });
      if (data) {
        const fileName = path.split("/").pop() || "unknown";
        outputFiles[fileName] = new File([data.buffer], fileName);
      }
    } catch (e) {
      console.warn(`Could not read output file ${path}:`, e);
    }
  }

  // Cleanup is now implicit as the module instance is contained
  // within this function's scope and will be garbage collected.

  return {
    stdout,
    stderr,
    files: outputFiles,
  };
};
