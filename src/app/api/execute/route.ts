import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    // Validate input
    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Create a unique filename
    const filename = 'Solution.java';
    const filepath = path.join('/tmp', filename);

    // Write code to a temporary file
    await writeFile(filepath, code);

    let result;
    try {
      // Compile
      await execAsync(`javac ${filepath}`);
      
      // Run with a timeout of 5 seconds
      const { stdout, stderr } = await execAsync(`timeout 5 java -cp /tmp Solution`);
      result = { output: stdout, error: stderr };
    } catch (error: any) {
      // Handle compilation errors
      if (error.stderr && error.stderr.includes('javac')) {
        result = { output: '', error: error.stderr };
      } 
      // Handle runtime errors
      else if (error.stderr) {
        result = { output: '', error: error.stderr };
      }
      // Handle timeout
      else if (error.code === 124) {
        result = { output: '', error: 'Program execution timed out after 5 seconds' };
      }
      // Handle other errors
      else {
        result = { output: '', error: error.message };
      }
    }

    // Clean up temporary files
    try {
      await unlink(filepath);
      await unlink(filepath.replace('.java', '.class'));
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 