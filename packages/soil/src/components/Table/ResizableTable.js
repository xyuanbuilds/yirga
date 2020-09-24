import * as React from 'react';
import { Table } from 'rsuite';
import 'rsuite/lib/Table/styles/index.less';
import fakeLargeData from '../test.json';

const data = JSON.parse(JSON.stringify(fakeLargeData));

const { Column, HeaderCell, Cell } = Table;

class LargeTable extends React.PureComponent {
  render() {
    const { virtualized, resizable, fixed } = this.props;
    return (
      <div>
        <Table
          virtualized={virtualized}
          height={400}
          data={data}
          onRowClick={(rowData) => {
            console.log(rowData);
          }}
        >
          <Column width={70} align="center" resizable={resizable} fixed={fixed}>
            <HeaderCell>Id</HeaderCell>
            <Cell dataKey="id" />
          </Column>

          <Column width={130} resizable={resizable}>
            <HeaderCell>First Name</HeaderCell>
            <Cell dataKey="firstName" />
          </Column>

          <Column width={130} resizable={resizable}>
            <HeaderCell>Last Name</HeaderCell>
            <Cell dataKey="lastName" />
          </Column>

          <Column width={200} resizable={resizable}>
            <HeaderCell>City</HeaderCell>
            <Cell dataKey="city" />
          </Column>

          <Column width={200} resizable={resizable}>
            <HeaderCell>Street</HeaderCell>
            <Cell dataKey="street" />
          </Column>

          <Column
            width={200}
            resizable={resizable}
            fixed={fixed ? 'right' : false}
          >
            <HeaderCell>Company Name</HeaderCell>
            <Cell dataKey="companyName" />
          </Column>
        </Table>
      </div>
    );
  }
}

export default LargeTable;
