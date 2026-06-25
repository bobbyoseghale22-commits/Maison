import mongoose from "mongoose";
import { env } from "@/config/env";

/**
 * Mongoose maintains a global connection cache across hot reloads in
 * development and across warm Lambda/container invocations in
 * production. Without this, every file change (dev) or every
 * invocation (serverless) would open a brand new connection and
 * eventually exhaust MongoDB Atlas's connection limit.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connects to MongoDB Atlas, reusing an existing connection/promise
 * whenever one is already established or in flight.
 *
 * Usage:
 *   await connectToDatabase();
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(env.MONGODB_URI, opts)
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset the promise so the next call can retry instead of
    // permanently caching a failed connection attempt.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Gracefully disconnects from MongoDB. Primarily useful in test
 * teardown or scripts run outside the Next.js server lifecycle.
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

export default connectToDatabase;
