/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AColumn, {EOrientation} from './AColumn';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc, IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {SORT} from '../SortHandler/SortHandler';
import {scaleTo} from './utils';
import {createNode} from 'phovea_core/src/multiform/internal';
import * as d3 from 'd3';
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import {IMultiForm} from '../../../phovea_core/src/multiform/IMultiForm';
import VisManager from './VisManager';
export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {
  multiform: MultiForm;
  dataView: IDataType;
  static readonly EVENT_SORTBY_COLUMN_HEADER = 'sortByMe';
  multiformList = [];

  constructor(data: DATATYPE, orientation: EOrientation) {
    super(data, orientation);
    this.dataView = data;
    this.rangeView = (<any>data).indices;

  }

  protected multiFormParams($body: d3.Selection<any>, domain?): IMultiFormOptions {
    return {
      all: {
        width: $body.property('clientWidth'),
        heightTo: $body.property('clientHeight'),
        sort: this.sortCriteria
      }
    };
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    const $sortButton = $toolbar.append('button')
      .attr('class', 'fa sort fa-sort-amount-asc')
      .on('click', () => {
        if ($sortButton.classed('fa-sort-amount-asc')) {
          // const sortMethod = SORT.desc;
          this.sortCriteria = SORT.desc;
          this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);
          $sortButton.attr('class', 'fa sort fa-sort-amount-desc');
        } else {
          this.sortCriteria = SORT.asc;
          this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);
          $sortButton.attr('class', 'fa sort fa-sort-amount-asc');
        }
      });
    super.buildToolbar($toolbar);
  }

  updateSortIcon() {
    if (this.sortCriteria === SORT.desc) {
      const s = this.$node.select('.fa.sort.fa-sort-amount-asc');
      s.attr('class', 'fa sort fa-sort-amount-desc');
    }
    if (this.sortCriteria === SORT.asc) {
      const s = this.$node.select('.fa.sort.fa-sort-amount-desc');
      s.attr('class', 'fa sort fa-sort-amount-asc');
    }
  }

  async updateMultiForms(idRanges: Range[]) {
    const v: any = await this.data.data(); // wait first for data and then continue with removing old forms
    const domain = d3.extent(v);

    const viewPromises = idRanges.map((r) => this.data.idView(r));
    Promise.all(viewPromises).then((views) => {
      this.updateSortIcon();
      this.body.selectAll('.multiformList').remove();
      this.multiformList = [];

      views.forEach((view) => {
        const $multiformdivs = this.body.append('div').classed('multiformList', true);
        const $header = $multiformdivs.append('div').classed('vislist', true);
        this.body.selectAll('.multiformList')
          .on('mouseover', function () {
            d3.select(this).select('.vislist').style('display', 'block');
          })
          .on('mouseleave', function () {
            d3.select(this).select('.vislist').style('display', 'none');
          });
        const m = new MultiForm(view, <HTMLElement>$multiformdivs.node(), this.multiFormParams($multiformdivs, domain));
        m.addIconVisChooser(<HTMLElement>$header.node());
        this.multiformList.push(m);
      });
    });
  }
  private superbag(sup, sub) {
    let i, j;
    for (i=0,j=0; i<sup.length && j<sub.length;) {
        if (sup[i] < sub[j]) {
            ++i;
        } else if (sup[i] == sub[j]) {
            ++i; ++j;
        } else {
            return false;
        }
    }
    return j == sub.length;
}

  private addIconVisChooser(toolbar: HTMLElement, multiform: MultiForm) {
    const s = toolbar.ownerDocument.createElement('div');
    toolbar.insertBefore(s, toolbar.firstChild);
    const visses = multiform.visses;

 /*   visses.forEach((v) => {
      const child = createNode(s, 'i');
      v.iconify(child);
      child.onclick = () => {
        multiform.switchTo(v);
        VisManager.setUserVis(multiform.id, v);

      };
    });*/
  }

}

export default AVectorColumn;
