import AColumn from './AColumn';
import Range1D from 'phovea_core/src/range/Range1D';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {list as rlist} from 'phovea_core/src/range';
import {IDataType} from 'phovea_core/src/datatype';
import {scaleTo} from './utils';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  readonly node: HTMLElement;
  private multiform: MultiForm;

  constructor(data: INumericalMatrix, columnParent: HTMLElement) {
    super(data);
    this.node = this.build(columnParent);
  }

  protected multiFormParams(): IMultiFormOptions {
    return {
      initialVis: 'phovea-vis-heatmap'
    };
  }

  protected buildBody(body: HTMLElement) {
    this.multiform = new MultiForm(this.data, body, this.multiFormParams());
  }

  protected buildToolbar(toolbar: HTMLElement) {
    toolbar.insertAdjacentHTML('afterbegin', `<div class="vislist"></div>`);
    if (this.multiform) {
      const vislist = <HTMLElement>toolbar.querySelector('div.vislist');
      this.multiform.addIconVisChooser(vislist);
    }
    super.buildToolbar(toolbar);
  }

  private replaceMultiForm(data: IDataType, body: HTMLElement) {
    const m = new MultiForm(this.data, body, this.multiFormParams());
    const vislist = <HTMLElement>this.toolbar.querySelector('div.vislist');
    vislist.innerHTML = ''; // clear old
    this.multiform.addIconVisChooser(vislist);
    return m;
  }

  layout(width: number, height: number) {
    scaleTo(this.multiform, width, height);
  }

  update(idRange: Range1D) {
    this.multiform.destroy();
    this.data.idView(rlist(idRange)).then((view) => {
      this.multiform = this.replaceMultiForm(view, this.body);
    });
  }
}
