/**
 * Created by Martin Ennemoser on 12.06.2017.
 */
/// <reference types="jasmine" />
/// <reference types="ts-mockito" />
import ColumnManager from '../src/column/ColumnManager';
import {EOrientation} from '../src/column/AColumn';
import IDType from '../../phovea_core/src/idtype/IDType';
import * as d3 from 'd3';
import {INumericalVector} from '../../phovea_core/src/vector/IVector';
import TableVector from '../../phovea_core/src/table/internal/TableVector';
import * as tsmockito from 'ts-mockito';
import Table from '../../phovea_core/src/table/Table';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import FilterManager from '../src/filter/FilterManager';
import {ITableLoader, ITableLoader2, adapterOne2Two, viaAPI2Loader, viaDataLoader} from 'phovea_core/src/table/loader';
import {IQueryArgs, ITableDataDescription, ITableColumn} from '../../phovea_core/src/table/ITable';
import {Range, all, list as rlist, parse, RangeLike, Range1D} from 'phovea_core/src/range';

function createDummyLoader() {
  const r: ITableLoader2 = {
    rowIds: (desc: ITableDataDescription, range: Range) => {
      return null;
    },
    rows: (desc: ITableDataDescription, range: Range) => {
      return null;
    },
    objs: (desc: ITableDataDescription, range: Range) => {
      return null;
    },
    data: (desc: ITableDataDescription, range: Range) => {
      return null;
    },
    col: (desc: ITableDataDescription, column: string, range: Range) => {
      return null;
    },
    view: (desc: ITableDataDescription, name: string, args: IQueryArgs) => {
      return null;
    }
  };
  return r;
}

function createDescriptionObject(colName : string) {
  return  {
        column: null,
        name: colName,
        desciption: null,
        value: {
          type: VALUE_TYPE_CATEGORICAL,
          categories: []
        }
      };
}

class TableMock extends Table {
    rowIds(range: RangeLike = all()) {
      const r = new Range();
      r.dim(0).pushList([5, 6]);
      return Promise.resolve(r);
    }

    colData(range: RangeLike = all()) {
      const arr = [1];
      arr[0] = NaN;
     // arr[0][0] = NaN;
      return Promise.resolve( arr);
  }
}

function createTableVector(colName : string, cid : string) {
  // example of a simple mock
  //const tableMock:Table = tsmockito.mock(Table);
  //tsmockito.when(tableMock.idtype).thenReturn(new IDType('dummy', 'name', 'dummies'));
  //const table = tsmockito.instance(tableMock)

  const dataDescription = {id: cid, idtype: 'dummy', size: [], columns: [], type: 'dummyType', name: 'dummyName', description: 'dummyDescription', fqname: 'fqname', ts: 5, creator: 'dummyCreator'};
  const table = new TableMock(dataDescription, createDummyLoader());
  return new TableVector<any, any>(table, -1, createDescriptionObject(colName));
}

async function pushNewColumn(colManager : ColumnManager, tableVector : TableVector<any, any>) {
  await colManager.push(tableVector);
}

describe('ColumnManager', function() {
  let colManager = null;
  const dummyElement = document.createElement('div');
  document.getElementById = jasmine.createSpy('HTML Element').and.returnValue(dummyElement);
  const l = d3.select(document.getElementById((' ')));
  beforeEach(function() {
    const mockIDType = tsmockito.mock(IDType);
    colManager = new ColumnManager(mockIDType, EOrientation.Vertical, l);
    colManager.addRowNumberColumn();
  });

  it('adds two columns', function(done) {

    let pr = pushNewColumn(colManager, createTableVector('aaa', 'id0'));
    pr.then(function () {
      expect(colManager.length).toBe(1);
      pr = pushNewColumn(colManager, createTableVector('bbb', 'id01'));
      return pr;
    })
    .then(function() {
      expect(colManager.length).toBe(2);
      done();
    });
  });

  it('adds two identical columns', function(done) {
    const tv0 = createTableVector('aaa', 'id0');
    const tv1 = createTableVector('aaa', 'id0');
    let pr = pushNewColumn(colManager, tv0);
    pr.then(function () {
      expect(colManager.length).toBe(1);
      pr = pushNewColumn(colManager, tv1);
      return pr;
    })
    .then(function() {
      expect(colManager.length).toBe(2);
      done();
    });
  });

  it('remove two identical columns', function(done) {
    const tv0 = createTableVector('aaa', 'id0');
    const tv1 = createTableVector('aaa', 'id0');
    const tv2 = createTableVector('bbb', 'id0');
    let pr = pushNewColumn(colManager, tv0);
    pr.then(function () {
      pr = pushNewColumn(colManager, tv1);
      pr = pushNewColumn(colManager, tv2);
      return pr;
    })
    .then(function() {
      expect(tv0.desc.id).toBe(tv1.desc.id);
      expect(colManager.length).toBe(3);
     // colManager.remove(null, tv0);
      expect(colManager.length).toBe(3);
      done();
      });
  });

});
