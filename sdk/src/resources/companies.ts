import { HttpClient } from '../core/http-client';
import { CrudResource } from '../core/crud-resource';
import type { ListParams, RecordStatus } from '../types/common';

export interface Company {
  company_id: number;
  folio: string;
  company_name: string;
  logo: string | null;
  location: string | null;
  phone_number: string | null;
  rfc: string | null;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

export interface ListCompaniesParams extends ListParams {
  status?: RecordStatus;
}

export interface CreateCompanyInput {
  folio: string;
  company_name: string;
  logo?: string | null;
  location?: string | null;
  phone_number?: string | null;
  rfc?: string | null;
  status?: RecordStatus;
}

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export class CompaniesResource extends CrudResource<Company, ListCompaniesParams, CreateCompanyInput, UpdateCompanyInput> {
  constructor(http: HttpClient) {
    super(http, '/api/v1/companies');
  }
}
