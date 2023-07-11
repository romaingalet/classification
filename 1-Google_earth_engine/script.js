var countries = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");
// var roiF = countries.filter(ee.Filter.eq('country_na', 'France'));
// Map.addLayer(roiF, {}, 'France', true);

var roi = ee.Geometry.Rectangle([
    ee.Geometry.Point(1.67, 43.26),  
    ee.Geometry.Point(1.87, 43.36)
  ]);
Map.addLayer(roi, {}, 'zone31', true);

var image = ee.ImageCollection("COPERNICUS/S2_SR")
.filterDate('2020-01-01', '2020-01-30')
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
.filterBounds(roi)
.median();

var visParamsTrue = {bands: ['B4', 'B5', 'B2'], min:0, max:2500, gamma:1.1};
Map.addLayer(image.clip(roi), visParamsTrue, 'Sentinel 2020');
Map.centerObject(roi, 8);

var training = water.merge(cropland).merge(forest).merge(urban);
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
    '253494',
    '006837',
    '000000',
    'FF8000',
  ]
  
Map.addLayer(classified.clip(roi), {palette: landcoverPalette, min:0, max:3}, 'Classification CART');