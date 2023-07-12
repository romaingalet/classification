var countries = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");

var roi = ee.Geometry.Rectangle([
    ee.Geometry.Point(2.30, 49.20),  
    ee.Geometry.Point(3.00, 49.60)
  ]);
Map.addLayer(roi, {}, 'zone60', true);

var image = ee.ImageCollection("COPERNICUS/S2_SR")
.filterDate('2020-01-01', '2020-01-30')
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
.filterBounds(roi)
.median();

var visParamsTrue = {bands: ['B4', 'B5', 'B2'], min:0, max:2500, gamma:1.1};
Map.addLayer(image.clip(roi), visParamsTrue, 'Sentinel 2020');
Map.centerObject(roi, 8);

var training = water.merge(cropland).merge(deciduous).merge(urban).merge(coniferous);
print(training);

var label = 'Class';
var bands = ['B2', 'B3', 'B4', 'B8'];
var input = image.select(bands);

var trainImage = input.sampleRegions({
collection: training,
properties: [label],
scale: 30
}) 

var trainingData = trainImage.randomColumn();
var trainSet = trainingData.filter(ee.Filter.lessThan('random', 0.8));
var testSet = trainingData.filter(ee.Filter.greaterThanOrEquals('random', 0.8));

var classifier = ee.Classifier.smileCart().train(trainSet, label, bands);

var classified = input.classify(classifier);

var landcoverPalette= [
    '0a60f5',
    '34ed50',
    '000000',
    'FF8000',
    '006837',
  ]
  
Map.addLayer(classified.clip(roi), {palette: landcoverPalette, min:0, max:4}, 'Classification CART');

Export.image.toDrive({
image: classified.clip(roi),
description: "Sentinel_2_CART",
scale: 10,
region: roi,
maxPixels:1e13,
folder: 'ee_demos',
crs:'EPSG:2154'
})