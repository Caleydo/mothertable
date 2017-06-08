/**
 * Created by Caleydo Team on 31.08.2016.
 */

import {listAll, IDType} from 'phovea_core/src/idtype';
import * as d3 from 'd3';
import ColumnManager, {IMotherTableType, AnyColumn} from './column/ColumnManager';
import SupportView from './SupportView';
import {EOrientation, default as AColumn} from './column/AColumn';
import MatrixFilter from './filter/MatrixFilter';
import MatrixColumn from './column/MatrixColumn';
import FilterManager from './filter/FilterManager';
import {AVectorColumn} from './column/AVectorColumn';
import {IAnyVector} from 'phovea_core/src/vector';
import Range from 'phovea_core/src/range/Range';
import {hash} from 'phovea_core/src/index';
import {IDataType} from 'phovea_core/src/datatype';
import {IFuelBarDataSize} from './SupportView';
import Range1D from 'phovea_core/src/range/Range1D';
import {AnyFilter, default as AFilter} from './filter/AFilter';
import {formatIdTypeName, makeRangeFromList} from './column/utils';
import {on, fire} from 'phovea_core/src/event';
import NumberColumn from './column/NumberColumn';
import {AVectorFilter} from './filter/AVectorFilter';


/**
 * The main class for the App app
 */
export default class App {

  private readonly $node: d3.Selection<any>;

  private colManager: ColumnManager;
  private supportView: SupportView[] = [];
  private idtypes: IDType[];
  private rowRange: Range;
  private dataSize: IFuelBarDataSize;

  constructor(parent: HTMLElement) {
    this.$node = d3.select(parent);
  }

  async build() {
    this.attachListener();
    await this.loadIdtypes();

    if (hash.has('idtype')) {
      const idtype = this.idtypes.filter((d) => d.id === hash.getProp('idtype'));
      if (idtype.length > 0) {
        this.setPrimaryIDType(idtype[0]);
        return; // exit function -> do not build start selection
      }
    }

    this.buildStartSelection(d3.select('#startSelection'));
  }

  private async loadIdtypes() {
    // get all idtypes, filter to the valid ones and SORT by name
    this.idtypes = (await listAll())
      .filter((d) => d instanceof IDType)
      .map((d) => <IDType>d)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private buildStartSelection(elem: d3.Selection<any>) {
    // d3 binding to the dialog
    const elems = elem.select('div.btn-group[role="group"]').selectAll('div.btn-group').data(this.idtypes);
    elems.enter().append('div')
      .classed('btn-group', true)
      .attr('role', 'group')
      .html(`<button type="button" class="btn btn-default btn-lg"></button>`);
    elems.select('button')
      .text((d) => formatIdTypeName(d.name))
      .on('click', (idtype) => {
        hash.setProp('idtype', idtype.id);
        this.setPrimaryIDType(idtype);
      });
    elems.exit().remove();
  }

  /**
   * Removes the start selection
   */
  private hideSelection() {
    this.$node.select('#startSelection')
      .style('display', 'none');
  }

  /**
   * Shows the start selection
   */
  private showSelection() {
    this.$node.select('#startSelection')
      .style('display', null);
  }

  private reset() {
    this.supportView[0].destroy();
    this.colManager.destroy();
    d3.selectAll('.rightPanel').remove();
    this.showSelection();
  }

  private attachListener() {
    const debounce = (fn, delay) => {
      let delayed;

      return function (e) {
        clearTimeout(delayed);
        delayed = setTimeout(function () {
          fn(e);
        }, delay);
      };
    };

    window.addEventListener('resize', debounce(() => {
      if (this.colManager) {
        this.colManager.relayout();
      }
    }, 300));

    on(AFilter.EVENT_MATRIX_REMOVE, this.removeSupportView.bind(this));
  }

  private removeSupportView(evt: any, idType: IDataType, currentIDType: string) {
    const otherIdType = this.findType(idType, currentIDType);
    const sView = this.supportView.filter((d) => d.idType.id === otherIdType.id);
    d3.selectAll(`.support-view-${otherIdType.id}.support-view`).remove();
    this.supportView.splice(this.supportView.indexOf(sView[0]), 1);

  }

  private findType(data: IDataType, currentIDType: string) {
    const coltype = data.desc.coltype;
    const rowtype = data.desc.rowtype;
    if (rowtype === currentIDType) {
      const idType = this.idtypes.filter((d) => d.id === coltype);
      return idType[0];

    } else if (coltype === currentIDType) {
      const idType = this.idtypes.filter((d) => d.id === rowtype);
      return idType[0];
    }
  }

  private primarySortCol(evt: any, sortColdata: AnyColumn) {
    this.supportView[0].sortByColumnHeader(sortColdata);

  }

  private async setPrimaryIDType(idtype: IDType) {
    this.hideSelection();

    // create a column manager
    this.colManager = new ColumnManager(idtype, EOrientation.Vertical, this.$node.select('main'));
    this.colManager.on(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this.primarySortCol.bind(this));
    this.colManager.on(SupportView.EVENT_DATASETS_ADDED, async (evt: any, col, numberCols) => {
      this.colManager.removeMatrixCol(col, numberCols);
      numberCols.forEach((d) => this.supportView[0].filterManager.updateFilterView(d));
      await this.supportView[0].addFilter(col.data);
    });
    this.colManager.on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, (evt: any, data) => {
      this.supportView[0].sortFilterByHeader(data);
    });

    this.colManager.on(MatrixColumn.EVENT_CONVERT_TO_VECTOR, (evt: any, matrixViews: IAnyVector[], aggfunction: string, col: MatrixColumn) => {
      let matrixData: any = matrixViews;
      if (matrixData === undefined) {
        matrixData = [col.data];
      }
      const matrixOnly = this.colManager.columns.filter((d) => d.data.desc.type === AColumn.DATATYPE.matrix);
      const supportIndex = matrixOnly.indexOf(col) + 1;
      const flattenedMatrix = this.colManager.convertMatrixToVector(matrixData, aggfunction);
      flattenedMatrix.map((fm) => this.updateTableView(fm, supportIndex, col));
    });


    const supportView = new SupportView(idtype, this.$node.select('.rightPanel'), this.supportView.length);
    supportView.on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, (evt: any, data) => {
      const col = this.colManager.updateSortByIcons(data);
      (<AVectorColumn<any, any>>col).updateSortIcon(data.sortMethod);
    });

    this.supportView.push(supportView);

    supportView.on(FilterManager.EVENT_SORT_DRAGGING, (evt: any, data: AnyFilter[]) => {
      this.colManager.mapFiltersAndSort(data);
    });

    this.colManager.addRowNumberColumn();

    // add columns if we add one or multiple datasets
    supportView.on(SupportView.EVENT_DATASETS_ADDED, async (evt: any, datasets: IMotherTableType[]) => {
      // first push all the new columns ...
      const columns: AnyColumn[] = [];
      for (const data of datasets) {
        if (this.dataSize === undefined) {
          this.dataSize = {total: data.length, filtered: data.length};
          supportView.updateFuelBar(this.dataSize);
        }
        columns.push(await this.colManager.push(data));
      }

      // add new support views for matrix column
      const matrixColumns = <MatrixColumn[]>columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.matrix);
      for (const col of matrixColumns) {
        await this.addMatrixColSupportManger(col);
      }

      this.colManager.updateColumns();
    });

    supportView.on(SupportView.EVENT_FILTER_CHANGED, (evt: any, filter: Range) => {
      this.colManager.filterData(filter);
      this.rowRange = filter;
      this.dataSize.filtered = filter.size()[0];
      supportView.updateFuelBar(this.dataSize);
    });

    this.colManager.on(ColumnManager.EVENT_DATA_REMOVED, (evt: any, data: IMotherTableType) => {
      const cols = this.colManager.columns;
      const countSame = cols.filter((d, i) => d.data === data).length;
      if (countSame < 1) {
        supportView.remove(data);
      }

      if (this.colManager.length === 0) {
        this.reset();
      }
    });


    this.colManager.on(NumberColumn.EVENT_CONVERT_TO_MATRIX, async (evt: any, col: NumberColumn) => {
      const matrixData = (<any>col).data.m;

      // To add the previous col stratifiers
      this.colManager.on(ColumnManager.EVENT_COLUMN_ADDED, (evt: any, matrixCol: MatrixColumn) => {
        matrixCol.matrixFilters = col.matrixFilters;
        //this.addMatrixView(matrixCol, this.supportView.length - 1)
        this.colManager.off(ColumnManager.EVENT_COLUMN_ADDED, null);
      });
      await this.supportView[0].addFilter(matrixData);  // Create columns and filters
      //this.colManager.updateTableView(matrixData, col);
      this.supportView[0].updateFilterView(col);

    });

    await supportView.init();

  }


  private async updateTableView(flattenedMatrix: IAnyVector, supportIndex: number, col: MatrixColumn) {
    //this.supportView[0].fire(SupportView.EVENT_DATASETS_ADDED, [flattenedMatrix], col);
    this.colManager.on(ColumnManager.EVENT_COLUMN_ADDED, (evt: any, numCol: NumberColumn) => {
      numCol.matrixFilters = col.colStratsColumns;
      this.colManager.updateTableView(flattenedMatrix, col);
      this.colManager.off(ColumnManager.EVENT_COLUMN_ADDED, null);
    });

    await this.supportView[0].addFilter(flattenedMatrix);

    // this.colManager.updateTableView(flattenedMatrix, col);
    this.supportView[0].updateFilterView(col);
    //If already deleted
    if (this.supportView[supportIndex] === undefined) {

      return;
    }
    this.supportView[supportIndex].destroy();
    this.supportView.splice(supportIndex, 1);
  }

  private async addMatrixColSupportManger(col: MatrixColumn): Promise<SupportView> {
    const otherIdtype: IDType = this.findType(col.data, col.idtype.id);
    const supportView = new SupportView(otherIdtype, this.$node.select('.rightPanel'), this.supportView.length);
    return supportView.init()
      .then(() => {
        this.supportView.push(supportView);
        const matrix = this.supportView[0].getMatrixData(col.data.desc.id);
        new MatrixFilter(matrix.t, supportView.$node);
        supportView.on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, (evt: any, data) => {
          col.sortByFilterHeader(data);
        });
        supportView.updateFuelBar(this.dataSize);
        supportView.on(SupportView.EVENT_FILTER_CHANGED, (evt: any, filter: Range) => {
          col.filterStratData(filter);
          this.dataSize.filtered = filter.size()[0];
          supportView.updateFuelBar(this.dataSize);
        });

        supportView.on(FilterManager.EVENT_SORT_DRAGGING, (evt: any, data: AnyFilter[]) => {
          col.updateColStratsSorting(data);
        });

        supportView.on(AFilter.EVENT_REMOVE_ME, (evt: any, data: IDataType) => {
          col.remove(data);
          this.colManager.relayout();
        });
        // add columns if we add one or multiple datasets
        supportView.on(SupportView.EVENT_DATASETS_ADDED, (evt: any, datasets: IMotherTableType[]) => {
          // first push all the new stratifications ...
          const promises = datasets.map((d) => {
            return col.pushColStratData(d);
          });
          // ... when all stratifications are pushed -> render the column and relayout
          Promise.all(promises)
            .then(() => {
              return Promise.all([col.updateColStrats(), col.updateMultiForms()]);
            })
            .then(() => {
              this.colManager.relayout();
            });

        });
        return supportView;

      })
      .then((supportView) => {
        // if restoring a matrix column from number column col.matrixFilters is set in ColumnManager.EVENT_COLUMN_ADDED in app.ts
        if (col === undefined || col.matrixFilters === undefined) {
          return Promise.resolve(supportView);
        }
        col.data.ids().then((range) => {
          const r = range.dim(1).asList();
          const promises = col.matrixFilters.map((c) => c.data.idView(r));
          return Promise.all(promises).then((cols: any) => {
            cols.forEach((c) => {
              supportView.addFilter(c);
            });
            return supportView;
          });
        });
      });
  }


}


/**
 * Factory method to create a new app instance
 * @param parent
 * @returns {App}
 */
export function create(parent: HTMLElement) {
  return new App(parent);
}

