import {redirect} from 'next/navigation';
import {isOperator} from '../../lib/auth';
import Dashboard from '../dashboard';
export const dynamic = 'force-dynamic';
export default async function AdminPage(){if(!await isOperator())redirect('/login?next=/admin');return <Dashboard/>;}
