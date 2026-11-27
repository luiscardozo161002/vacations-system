import type { Notice } from '@vacations/sdk';
import { formatAbsenceRange } from '../../../utils/format';
import { ListRow } from '../../../components/molecules/ListRow';
import { StatusBadge } from '../../../components/atoms/StatusBadge';

export function NoticeRow({ notice }: { notice: Notice }) {
  return (
    <ListRow
      title={notice.reason_description}
      subtitle={formatAbsenceRange(notice)}
      meta={<StatusBadge status={notice.status} />}
    />
  );
}
