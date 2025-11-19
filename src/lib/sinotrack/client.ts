import crypto from 'crypto';

const APP_PATH = '/APP/AppJson.asp';
const MARKERS = {
  row: String.fromCharCode(0x11),
  table: String.fromCharCode(0x1b),
};

type Primitive = string | number | boolean | null | undefined;

export interface SinoTrackOptions {
  server: string;
  account: string;
  password?: string;
  pageSize?: number;
  absolutePage?: number;
}

interface SinoTrackCommand {
  Cmd: string;
  Data: string;
  Field: string;
  PageSize?: number;
  AbsolutePage?: number;
}

export interface SinoTrackResponse {
  m_isResultOk: number;
  m_arrField?: string[];
  m_arrRecord?: Primitive[][];
  m_strError?: string;
  [key: string]: unknown;
}

export interface SinoTrackPosition {
  deviceId: string;
  recordedAt: string;
  longitude: number;
  latitude: number;
  speedKph: number;
  gsmSignal: number;
  gpsSignal: number;
  raw: Record<string, Primitive>;
}

const randomId = () => `MGTS_${Math.floor(Math.random() * 1e14).toString()}`;

const ensureHttpsBase = (server: string) => {
  if (!server) {
    throw new Error('Missing SinoTrack server URL');
  }
  const trimmed = server.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }
  return `https://${trimmed.replace(/\/+$/, '')}`;
};

const padToMultipleOf3 = (value: string) => {
  let result = value;
  while (result.length % 3 !== 0) {
    const seed = randomId();
    result += seed.charAt(7) || '0';
  }
  return result;
};

const normalizeHostForAppId = (server: string) => {
  let host = server.replace(/^https?:\/\//i, '');
  if (!host.endsWith('/')) {
    host += '/';
  }
  return padToMultipleOf3(host);
};

const buildData = (params: Array<string | number>) =>
  params
    .map((value) => `N'${String(value ?? '').replace(/'/g, "''")}'`)
    .join(',');

const createCommand = (
  cmd: string,
  params: Array<string | number> = [],
  field = '',
  options?: Pick<SinoTrackOptions, 'pageSize' | 'absolutePage'>,
): SinoTrackCommand => ({
  Cmd: cmd,
  Data: buildData(params),
  Field: field,
  PageSize: options?.pageSize,
  AbsolutePage: options?.absolutePage,
});

const encodePayload = (command: SinoTrackCommand, account: string, server: string) => {
  const nTimeStamp = Date.now();
  const strRandom = randomId().replace('MGTS_', '');
  const baseHost = normalizeHostForAppId(server);
  let tokenContent = `${command.Cmd}${MARKERS.row}${command.Data}${MARKERS.row}${command.Field}${MARKERS.row}`;
  if (
    typeof command.PageSize === 'number' &&
    command.PageSize > 0 &&
    typeof command.AbsolutePage === 'number' &&
    command.AbsolutePage > 0
  ) {
    tokenContent += `${command.PageSize}${MARKERS.row}${command.AbsolutePage}${MARKERS.row}`;
  }
  tokenContent += MARKERS.table;
  tokenContent = padToMultipleOf3(tokenContent);
  const strAppID = Buffer.from(baseHost, 'utf8').toString('base64');
  const strToken = Buffer.from(tokenContent, 'utf8').toString('base64');
  const signSource = `${nTimeStamp}${strRandom}${account}${strAppID}${strToken}`;
  const strSign = crypto.createHash('md5').update(signSource).digest('hex');
  return {
    strAppID,
    strUser: account,
    nTimeStamp: String(nTimeStamp),
    strRandom,
    strSign,
    strToken,
  };
};

const parseRecords = (fields: string[] = [], records: Primitive[][] = []) =>
  records.map((row) =>
    fields.reduce<Record<string, Primitive>>((acc, field, index) => {
      acc[field] = row[index];
      return acc;
    }, {}),
  );

export const callSinoTrack = async (
  commandName: string,
  params: Array<string | number>,
  options: SinoTrackOptions,
) => {
  const server = ensureHttpsBase(options.server);
  const command = createCommand(commandName, params, '', {
    pageSize: options.pageSize,
    absolutePage: options.absolutePage,
  });
  const payload = encodePayload(command, options.account, server);
  const endpoint = new URL(APP_PATH, `${server}/`).toString();
  const body = new URLSearchParams(payload).toString();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`SinoTrack request failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as SinoTrackResponse;
  } catch (error) {
    throw new Error(`Unable to parse SinoTrack response: ${(error as Error).message}`);
  }
};

export const fetchLatestPositions = async (
  options: {
    server: string;
    account: string;
    password: string;
    pageSize?: number;
    absolutePage?: number;
    deviceId?: string;
  },
): Promise<SinoTrackPosition[]> => {
  if (!options.password) {
    throw new Error('SinoTrack password is required');
  }

  const loginAttempts = ['Proc_Login', 'Proc_LoginIMEI'] as const;
  let lastErrorMessage = '';

  for (const attempt of loginAttempts) {
    const loginResult = await callSinoTrack(attempt, [options.account, options.password], options);
    if (loginResult.m_isResultOk === 1) {
      break;
    }
    lastErrorMessage = loginResult.m_strError ? String(loginResult.m_strError) : '';
    if (attempt === loginAttempts[loginAttempts.length - 1]) {
      throw new Error(
        lastErrorMessage || 'SinoTrack login failed – please double-check the ID/password and server',
      );
    }
  }

  const latestResult = await callSinoTrack('Proc_GetLastPosition', [options.account], options);
  if (latestResult.m_isResultOk !== 1) {
    throw new Error(latestResult.m_strError || 'Failed to retrieve latest position');
  }

  const records = parseRecords(latestResult.m_arrField, latestResult.m_arrRecord);
  const filtered = options.deviceId
    ? records.filter((record) => String(record.strTEID) === options.deviceId)
    : records;

  return filtered.map((record) => {
    const longitude = Number(record.dbLon ?? 0);
    const latitude = Number(record.dbLat ?? 0);
    const timestamp = Number(record.nTime ?? 0);
    const speed = Number(record.nSpeed ?? 0);
    const gsm = Number(record.nGSMSignal ?? 0);
    const gps = Number(record.nGPSSignal ?? 0);
    return {
      deviceId: String(record.strTEID ?? ''),
      longitude,
      latitude,
      recordedAt: timestamp > 0 ? new Date(timestamp * 1000).toISOString() : '',
      speedKph: speed,
      gsmSignal: gsm,
      gpsSignal: gps,
      raw: record,
    };
  });
};
