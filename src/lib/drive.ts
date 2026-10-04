/**
 * Drive provider interface.
 * Seeded file now; swap to Executor via DRIVE_PROVIDER=executor later.
 */

export type DriveFile = {
  id: string;
  name: string;
  url?: string;
};

export interface DriveProvider {
  findDriveFile(
    query: string,
  ): Promise<{ mode: "seeded" | "live"; file: DriveFile | null }>;
}

const SEEDED: DriveFile = {
  id: "drive-proposal-v3",
  name: "Project Proposal v3",
  url: "https://drive.google.com/file/d/demo-proposal-v3",
};

class SeededDriveProvider implements DriveProvider {
  async findDriveFile(query: string) {
    if (/project|proposal|doc/i.test(query)) {
      return { mode: "seeded" as const, file: SEEDED };
    }
    return { mode: "seeded" as const, file: null };
  }
}

class ExecutorDriveProvider implements DriveProvider {
  // TODO(verify): Executor Google Drive tool paths — not built yet
  async findDriveFile(
    _query: string,
  ): Promise<{ mode: "seeded" | "live"; file: DriveFile | null }> {
    throw new Error(
      "DRIVE_PROVIDER=executor is not implemented yet; use seeded",
    );
  }
}

export function getDriveProvider(): DriveProvider {
  if (process.env.DRIVE_PROVIDER === "executor") {
    return new ExecutorDriveProvider();
  }
  return new SeededDriveProvider();
}

export async function findDriveFile(query: string) {
  return getDriveProvider().findDriveFile(query);
}
