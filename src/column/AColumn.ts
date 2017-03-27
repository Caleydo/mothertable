/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import Range from 'phovea_core/src/range/Range';
import {EventHandler} from 'phovea_core/src/event';
import * as d3 from 'd3';
import {SORT} from '../SortHandler/SortHandler';
import {createNode} from 'phovea_core/src/multiform/internal';
import {formatAttributeName} from './utils';
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import {IVisPluginDesc, list as listVisses} from 'phovea_core/src/vis';
import VisManager from './VisManager';
import {EAggregationType} from './VisManager';
import TaggleMultiform from './TaggleMultiform';
import {dataValueTypeCSSClass, dataValueType} from './ColumnManager';

export enum EOrientation {
  Vertical,
  Horizontal
}

abstract class AColumn<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly VISUALIZATION_SWITCHED = 'switched';
  static readonly EVENT_REMOVE_ME = 'removeMe';
  static readonly EVENT_COLUMN_LOCK_CHANGED = 'locked';
  static readonly DATATYPE = {vector: 'vector', matrix: 'matrix', stratification: 'stratification'};
  $node: d3.Selection<any>;

  minWidth: number = 10;
  maxWidth: number = 100;
  minHeight: number = 2;
  maxHeight: number = 10;
  lockedWidth: number = -1;
  activeVis: string;
  minimumHeight: number = 2;
  preferredHeight: number = 30;

  dataView: IDataType;
  sortCriteria: string = SORT.asc;
  rangeView: Range;
  multiformList:TaggleMultiform[] = [];

  selectedAggVis: IVisPluginDesc;
  selectedUnaggVis: IVisPluginDesc;

  constructor(public readonly data: DATATYPE, public readonly orientation: EOrientation) {
    super();
  }

  get idtype() {
    return this.data.idtypes[0];
  }

  get body() {
    return this.$node.select(':scope > main'); // :scope = enforce direct children
  }

  get header() {
    return this.$node.select('header.columnHeader');
  }

  get toolbar() {
    return this.$node.select('header > .toolbar');
  }

  protected build($parent: d3.Selection<any>): d3.Selection<any> {
    if (this.orientation === EOrientation.Vertical) {
      return this.buildVertical($parent);
    }
    return this.buildHorizontal($parent);
  }

  /**
   * Add template for stratifications columns (in the header )
   * @param $parent
   * @returns {Selection<any>}
   */
  protected buildHorizontal($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = $parent.insert('li', 'li')
      .datum(this)
      .classed('column-strat', true)
      .classed('column-' + (this.orientation === EOrientation.Vertical ? 'hor' : 'ver'), true)
      .html(`
        <header>
          <div class="labelName">${formatAttributeName(this.data.desc.name)}</div>
        </header> 
        <main></main>
      `);
    return $node;
  }

  /**
   * Add template for regular columns (in the main view)
   * @param $parent
   * @returns {Selection<any>}
   */
  protected buildVertical($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = $parent
      .append('li')
      .datum(this)
      .classed('column', true)
      .classed('column-' + (this.orientation === EOrientation.Vertical ? 'hor' : 'ver'), true)
      .style('min-width', this.minWidth + 'px')
      .style('width', this.maxWidth + 'px')
      .html(`
        <aside></aside>
        <header class="columnHeader">
          <div class="labelName"><i class="${dataValueTypeCSSClass(dataValueType(this.data))}" aria-hidden="true"></i> <span>${formatAttributeName(this.data.desc.name)}</span></div>
          <div class="toolbar"></div>
        </header>
        <main></main>`);

    this.buildToolbar($node.select('div.toolbar'));

    return $node;
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    const $lockButton = $toolbar.append('a')
      .attr('title', 'Lock column')
      .html(`<i class="fa fa-unlock fa-fw" aria-hidden="true"></i><span class="sr-only">Lock column</span>`)
      .on('click', () => {
        this.lockColumnWidth($lockButton);
      });

    $toolbar.append('a')
      .attr('title', 'Remove column')
      .html(`<i class="fa fa-trash fa-fw" aria-hidden="true"></i><span class="sr-only">Remove column</span>`)
      .on('click', () => {
        this.fire(AColumn.EVENT_REMOVE_ME, this.data);
        // return false;
      });

    this.appendVisChooser($toolbar, 'fa fa-ellipsis-v fa-fw', 'Select visualization for unaggregated areas', EAggregationType.UNAGGREGATED);
    this.appendVisChooser($toolbar, 'fa fa-window-minimize fa-fw fa-rotate-90', 'Select visualization for aggregated areas', EAggregationType.AGGREGATED);
  }

  private addIconVisChooser(toolbar: HTMLElement, visses: IVisPluginDesc[], aggregationType: EAggregationType) {
    const s = toolbar.ownerDocument.createElement('div');
    toolbar.insertBefore(s, toolbar.firstChild);
    const visIds = VisManager.getPossibleVisses(this.data.desc.type, this.data.desc.value.type, aggregationType);
    const defVis = createNode(s, 'i');
    defVis.innerText = '--';
    defVis.onclick = () => {
      this.multiformList.forEach((mul) => {
        if (aggregationType === EAggregationType.UNAGGREGATED) {
          VisManager.userSelectedUnaggregatedVisses.delete(mul.id);
          this.selectedUnaggVis = null;
        } else {
          VisManager.userSelectedAggregatedVisses.delete(mul.id);
          this.selectedAggVis = null;
        }
      });
      this.fire(AColumn.VISUALIZATION_SWITCHED);
    };

    visses.forEach((v) => {
      if (visIds.indexOf(v.id) !== -1) {
        const child = createNode(s, 'i');
        v.iconify(child);
        child.onclick = () => {
          if (aggregationType === EAggregationType.UNAGGREGATED) {
            this.selectedUnaggVis = v;
          } else {
            this.selectedAggVis = v;
          }
          this.multiformList.forEach((mul) => {
            VisManager.setUserVis(mul.id, v, aggregationType);
          });
          this.fire(AColumn.VISUALIZATION_SWITCHED);
        };
      }
    });
  }

  private appendVisChooser($toolbar: d3.Selection<any>, faIcon: string, title: string, aggregationType) {
    const $node = $toolbar.append('div').classed('visChooser', true);

    this.addIconVisChooser(<HTMLElement>$node.node(), listVisses(this.data), aggregationType);
    $node.insert('i', ':first-child')
      .attr('title', title)
      .attr('class', faIcon)
      .attr('aria-hidden', 'true');

    $node
      .append('span')
      .attr('class', 'sr-only')
      .text(title);
  }


  async updateMultiForms(multiformRanges: Range[], stratifiedRanges?: Range[], brushedRanges?: Range[]):Promise<TaggleMultiform[]> {
    // hook
    return Promise.resolve(this.multiformList);
  }

  protected findGroupId(stratifiedRanges: Range[], multiformRange: Range) {
    if (stratifiedRanges === undefined) {
      return;
    }
    const m = stratifiedRanges
      .map((s) => s.intersect(multiformRange).size()[0]);
    const a = m.filter((d) => d > 0);
    const groupId = m.indexOf(a[0]);
    return groupId;

  }


  protected checkBrushed(brushedRanges: Range[], multiformRange: Range) {
    if (brushedRanges === undefined) {
      return;
    }
    const checkMe = brushedRanges.map((b) => multiformRange.intersect(b).size()[0]);
    const f = Math.max(...checkMe);
    return (f > 0) ? true : false;

  }


  protected lockColumnWidth($lockButton) {
    if ($lockButton.select('i').classed('fa-lock')) {
      // UNLOCKING
      $lockButton
        .classed('active', false)
        .attr('title', 'Lock column')
        .html(`<i class="fa fa-unlock fa-fw" aria-hidden="true"></i><span class="sr-only">Lock column</span>`);
      this.lockedWidth = -1;
      this.fire(AColumn.EVENT_COLUMN_LOCK_CHANGED, 'unlocked');

    } else {
      // LOCKING
      $lockButton
        .classed('active', true)
        .attr('title', 'Unlock column')
        .html(`<i class="fa fa-lock fa-fw" aria-hidden="true"></i><span class="sr-only">Unlock column</span>`);
      this.lockedWidth = this.$node.property('clientWidth');
      this.fire(AColumn.EVENT_COLUMN_LOCK_CHANGED, 'locked');
    }
  }


}

export default AColumn;
