/**
 * Created by Martin Ennemoser on 23.05.2017.
 */


import {ITransform} from 'phovea_core/src/vis';
import Histogram, {IHistogramOptions} from 'phovea_vis/src/distribution/Histogram';
import {IStratification} from 'phovea_core/src/stratification';
import {
  IHistAbleDataType, ICategoricalValueTypeDesc, INumberValueTypeDesc,
} from 'phovea_core/src/datatype';
import * as d3 from 'd3';


/**
 * Switches to a mosaic representation if only one bin is present
 */
export class OneBinHistogram extends Histogram {

  private isOneBin : boolean = false;
  constructor(public readonly data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>|IStratification, parent: Element, options: IHistogramOptions = {}) {
    super(data, parent, options);

  }
  protected build($svg: d3.Selection<any>) {
    this.data.hist(Math.floor(this.options.nbins)).then((hist) => {
      let nonZeroBins = 0;
      let lastNonZeroBin = -1;
      hist.forEach(function(value, index) {
        if(value > 0) {
          nonZeroBins++;
          lastNonZeroBin = index;
        }
      });

      this.isOneBin = nonZeroBins === 1;
      if(this.isOneBin) {
        console.assert(lastNonZeroBin >= 0);
        this.buildAsMosaic($svg, lastNonZeroBin);
      }
      else {
        super.build($svg);
      }
    });
    return $svg;
  }

  private buildAsMosaic($svg : d3.Selection<any>, lastNonZeroBin : number) {
    this.markReady();
    const fillColor = this.data.desc.value.categories[lastNonZeroBin].color;
    const dataLength = this.data.length;
    const name = this.data.desc.value.categories[lastNonZeroBin].name; //todo check if that holds
    const $g = $svg.append('g');
    $g.append('rect')
      .attr('width', this.size[0])
      .attr('height', this.size[1])
      .attr('fill', fillColor);
    const $text = $g.append('text');

    $text.classed('taggle-onebarhistogram', true);
    $text.attr('text-anchor', 'middle')
      .attr('x', '50%')
      .attr('y', '50%')
      .attr('style', 'alignment-baseline: middle');
    $text.text(name + dataLength);
  }

  transform(scale?: [number, number], rotate?: number): ITransform {
    if(!this.isOneBin) {
      if(arguments.length === 0) {
        return super.transform();
      }
      return super.transform(scale, rotate);
    }
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    const size = this.rawSize;
    this.$node.attr({
      width: size[0] * scale[0],
      height: size[1] * scale[1]
    }).style('transform', 'rotate(' + rotate + 'deg)');
    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return act;
  }
}

export default OneBinHistogram;

export function create(data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>, parent: Element, options?: IHistogramOptions) {
  return new OneBinHistogram(data, parent, options);
}

