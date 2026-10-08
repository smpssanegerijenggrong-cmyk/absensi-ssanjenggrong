import {getDb} from '../../../db';
import {createScanHandlers} from '../../../lib/scan-handlers';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const {GET, POST} = createScanHandlers({database: getDb});
