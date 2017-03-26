/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AColumn, {EOrientation} from './AColumn';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {list as rlist} from 'phovea_core/src/range';
import {scaleTo, NUMERICAL_COLOR_MAP} from './utils';
import {createColumn, AnyColumn, IMotherTableType} from './ColumnManager';
import * as d3 from 'd3';
import VisManager from './VisManager';
import AColumnManager from './AColumnManager';
import {AnyFilter, default as AFilter} from '../filter/AFilter';
import {EAggregationType} from './VisManager';
import TaggleMultiform from './TaggleMultiform';
import {AVectorFilter} from '../filter/AVectorFilter';
import {on} from 'phovea_core/src/event';


export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  minWidth: number = 150;
  maxWidth: number = 300;
  minHeight: number = 2;
  maxHeight: number = 25;

  private rowRanges: Range[] = [];
  private stratifiedRanges: Range[] = [];
  private brushedRanges: Range[] = [];
  private colRange: Range;
  dataView: IDataType;
  multiformList: TaggleMultiform[] = [];

  private $colStrat: d3.Selection<any>;
  private colStratManager: AColumnManager = new AColumnManager();

  constructor(data: INumericalMatrix, orientation: EOrientation, $columnParent: d3.Selection<any>) {
    super(data, orientation);
    this.dataView = data;
    this.calculateDefaultRange();
    this.$node = this.build($columnParent);
    this.attachListener();

  }

  protected build($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = super.build($parent);
    $node.classed('column-matrix', true);
    this.$colStrat = $node.select('aside')
      .append('ol')
      .attr('reversed', 'reversed');

    return $node;
  }

  protected multiFormParams(): IMultiFormOptions {
    return {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type, EAggregationType.UNAGGREGATED),
      'phovea-vis-heatmap': {
        color: NUMERICAL_COLOR_MAP
      }
    };
  }

  async updateMultiForms(rowRanges?: Range[], stratifiedRanges?: Range[], brushedRanges?: Range[], colRange?: Range) {
    this.body.selectAll('.multiformList').remove();
    this.multiformList = [];

    if (!rowRanges) {
      rowRanges = this.rowRanges;
    }
    this.rowRanges = rowRanges;

    if (!colRange) {
      colRange = (await this.calculateDefaultRange());
      this.colRange = colRange;
    }

    this.stratifiedRanges = stratifiedRanges;
    this.brushedRanges = brushedRanges;
    let id = 0;
    for (const r of rowRanges) {
      const $multiformDivs = this.body.append('div').classed('multiformList', true);

      let rowView = await this.data.idView(r);
      rowView = (<INumericalMatrix>rowView).t;

      let colView = await rowView.idView(colRange);
      colView = (<INumericalMatrix>colView).t;

      const m = new TaggleMultiform(colView, <HTMLElement>$multiformDivs.node(), this.multiFormParams());
      m.groupId = this.findGroupId(stratifiedRanges, rowRanges[id]);
      m.brushed = this.checkBrushed(brushedRanges, rowRanges[id]);
      this.multiformList.push(m);

      if (this.selectedAggVis) {
        VisManager.userSelectedAggregatedVisses.set(m.id, this.selectedAggVis);
      }
      if (this.selectedUnaggVis) {
        VisManager.userSelectedUnaggregatedVisses.set(m.id, this.selectedUnaggVis);
      }
      VisManager.multiformAggregationType.set(m.id, EAggregationType.UNAGGREGATED);

      id = id + 1;
    }
  }

  async calculateDefaultRange() {
    if (this.colRange === undefined) {
      const indices = await this.data.ids();
      this.colRange = rlist(indices.dim(1));
    }
    return this.colRange;
  }

  /**
   *
   * @param data
   * @returns {Promise<AnyColumn>}
   */
  pushColStratData(data: IMotherTableType) {
    const col = createColumn(data, EOrientation.Horizontal, this.$colStrat);
    this.colStratManager.add(col);
    return Promise.resolve(col);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async updateColStrats() {
    const rangeListMap: Map<string, Range[]> = await this.colStratManager.sort();
    console.log(rangeListMap, this.colStratManager.columns); // see output for stratification
    this.colRange = this.colStratManager.nonStratifiedRange;
    this.updateMultiForms(this.rowRanges, this.stratifiedRanges, this.brushedRanges, this.colRange)
    this.colStratManager.stratify(rangeListMap);
  }

  filterStratData(range: Range) {
    this.colStratManager.filter([range]);
  }

  updateColStratsSorting(filterList: AnyFilter[]) {
    this.colStratManager.sortByFilters(filterList);
    this.updateColStrats();
    // TODO still need to update the DOM order in `this.$colStrat`
  }


  private attachListener() {
    on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, (evt: any, sortData) => {
      const col = this.colStratManager.columns.filter((d) => d.data.desc.id === sortData.col.data.desc.id);
      if (col.length === 0) {
        return;
      }
      col[0].sortCriteria = sortData.sortMethod;
      this.updateColStrats();
    });


  }

}
