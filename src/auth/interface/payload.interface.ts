export interface JwtPayload {
  sub?: string;
  id?: string;
  name: string;
  lastName: string;
  email: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}
