import {URLHash} from '../src/URLHash';
/**
 * Created by Holger Stitz on 09.03.2017.
 */
/// <reference types="jasmine" />


describe('hash to properties', () => {

  it('empty hash', () => {
    const hash = '#';
    expect(URLHash.hashToProps(hash).size).toEqual(0);
  });

  it('single property', () => {
    const hash = '#key1=value1';
    expect(URLHash.hashToProps(hash).size).toEqual(1);
  });

  it('multiple properties', () => {
    const hash = '#key=value;key2=value2';
    expect(URLHash.hashToProps(hash).size).toEqual(2);
  });

});


describe('properties to hash', () => {
  const props:Map<string, string> = new Map();

  it('empty properties', () => {
    expect(URLHash.propsToHash(props)).toEqual('#');
  });

  it('single property', () => {
    props.set('key1', 'value1');
    expect(URLHash.propsToHash(props)).toEqual('#key1=value1');
  });

  it('multiple properties', () => {
    props.set('key1', 'value1');
    props.set('key2', 'value2');
    expect(URLHash.propsToHash(props)).toEqual('#key1=value1;key2=value2');
  });

});
