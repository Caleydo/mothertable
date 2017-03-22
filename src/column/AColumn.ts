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
import AVectorFilter from '../filter/AVectorFilter';
import {formatAttributeName} from './utils';
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import {IMultiForm} from 'phovea_core/src/multiform/IMultiForm';
import {IVisPluginDesc} from 'phovea_core/src/vis';
import VisManager from './VisManager';
import {AggMode} from './VisManager';
import AggSwitcherColumn from './AggSwitcherColumn';


export enum EOrientation {
  Horizontal,
  Vertical
}

abstract class AColumn<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly VISUALIZATION_SWITCHED = 'switched';
  static readonly EVENT_REMOVE_ME = 'removeMe';
  static readonly EVENT_COLUMN_LOCK_CHANGED = 'locked';
  static readonly DATATYPE = {vector: 'vector', matrix: 'matrix'};
  private aggSwitcherCol: AggSwitcherColumn;
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
  multiformList = [];

  selectedAggVis:IVisPluginDesc;
  selectedUnaggVis:IVisPluginDesc;

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
    if (this.orientation === EOrientation.Horizontal) {
      return this.buildHorizontal($parent);
    }
    return this.buildVertical($parent);
  }

  /**
   * Add template for stratifications columns (in the header )
   * @param $parent
   * @returns {Selection<any>}
   */
  protected buildVertical($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = $parent.insert('li', 'li')
      .datum(this)
      .classed('column-strat', true)
      .classed('column-' + (this.orientation === EOrientation.Horizontal ? 'hor' : 'ver'), true)
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
  protected buildHorizontal($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = $parent
      .append('li')
      .datum(this)
      .classed('column', true)
      .classed('column-' + (this.orientation === EOrientation.Horizontal ? 'hor' : 'ver'), true)
      .style('min-width', this.minWidth + 'px')
      .style('width', this.maxWidth + 'px')
      .html(`
        <aside></aside>
        <header class="columnHeader">
          <div class="labelName">${formatAttributeName(this.data.desc.name)}</div>
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
        this.fire(AColumn.EVENT_REMOVE_ME);
        return false;
      });

    this.appendVisChooser($toolbar, 'fa fa-ellipsis-v fa-fw', 'Select visualization for unaggregated areas', AggMode.Unaggregated);
    this.appendVisChooser($toolbar, 'fa fa-window-minimize fa-fw fa-rotate-90', 'Select visualization for aggregated areas', AggMode.Aggregated);
  }

  private addIconVisChooser(toolbar: HTMLElement, multiform: MultiForm, aggregationType) {
    const s = toolbar.ownerDocument.createElement('div');
    toolbar.insertBefore(s, toolbar.firstChild);
    const visses = multiform.visses;
    const visIds = VisManager.getPossibleVisses(this.data.desc.type, this.data.desc.value.type, aggregationType);
    const defVis = createNode(s, 'i');
    defVis.innerText = "--";
    defVis.onclick  = () => {
      this.multiformList.forEach((mul) => {
        if(aggregationType == AggMode.Unaggregated){
          delete VisManager.userSelectedUnaggregatedVisses[mul.id.toString()];
          this.selectedUnaggVis = null;
        }else{
          delete VisManager.userSelectedAggregatedVisses[mul.id.toString()];
          this.selectedAggVis = null;
        }
      });
      this.fire(AColumn.VISUALIZATION_SWITCHED);
    };

    visses.forEach((v) => {
      if(visIds.indexOf(v.id) != -1){
        const child = createNode(s, 'i');
        v.iconify(child);
        child.onclick = () => {
          if(aggregationType == AggMode.Unaggregated){
            this.selectedUnaggVis = v;
          }else{
            this.selectedAggVis = v;
           }
          this.multiformList.forEach((mul) => {
            VisManager.setUserVis(mul.id, v, aggregationType);
          });
          this.fire(AColumn.VISUALIZATION_SWITCHED);
          console.log('selected', v);
        }
      }
    });
  }

  private appendVisChooser($toolbar:d3.Selection<any>, faIcon:string, title:string, aggregationType):IMultiForm {
    const $node = $toolbar.append('div').classed('visChooser', true);

    const m = new MultiForm(this.data, document.createElement('dummy-to-discard'), { initialVis: this.activeVis });
    this.addIconVisChooser(<HTMLElement>$node.node(), m, aggregationType);
    $node.insert('i', ':first-child')
      .attr('title', title)
      .attr('class', faIcon)
      .attr('aria-hidden', 'true');

    $node
      .append('span')
      .attr('class', 'sr-only')
      .text(title);

    return m;
  }


  async updateMultiForms(rowRanges: Range[]) {
    // hook
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
