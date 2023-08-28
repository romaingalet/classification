var countries = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");

var roi = ee.Geometry.Rectangle([
    ee.Geometry.Point(3.11, 49.513),  
    ee.Geometry.Point(3.249, 49.604)
  ]);
Map.addLayer(roi, {}, 'zone60', true);

var image = ee.ImageCollection("COPERNICUS/S2_SR")
.filterDate('2020-01-01', '2020-03-30')
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
.filterBounds(roi)
.median();

var visParamsTrue = {bands: ['B4', 'B5', 'B2'], min:0, max:2500, gamma:1.1};
Map.addLayer(image.clip(roi), visParamsTrue, 'Sentinel 2020');
Map.centerObject(roi, 8);

var training = CO.merge(EV).merge(CL).merge(UR);
print(training);

var label = 'class';
var bands = ['B2', 'B3', 'B4', 'B8'];
var input = image.select(bands);

var ndvi = image.normalizedDifference(['B8','B4']).rename('NDVI');
var ndwi = image.normalizedDifference(['B3','B8']).rename('NDWI');
var swir = image.select(['B11']).rename('swir');

var new_image = ee.Image.cat([input, ndvi, ndwi, swir]);
// var new_image = ee.Image.cat([input]);

var trainImage = new_image.sampleRegions({
collection: training,
properties: [label],
scale: 30
})

var trainingData = trainImage.randomColumn();
var trainSet = trainingData.filter(ee.Filter.lessThan('random', 0.6));
var testSet = trainingData.filter(ee.Filter.greaterThanOrEquals('random', 0.6));

print(trainSet)

var classifier = ee.Classifier.smileRandomForest(5).train(trainSet, label, bands);

var classified = new_image.classify(classifier);

// Sans NDVI -> REmplacer par ce code 

// var trainImage = input.sampleRegions({
// collection: training,
// properties: [label],
// scale: 30
// }) 

// var trainingData = trainImage.randomColumn();
// var trainSet = trainingData.filter(ee.Filter.lessThan('random', 0.8));
// var testSet = trainingData.filter(ee.Filter.greaterThanOrEquals('random', 0.8));

// var classifier = ee.Classifier.smileCart().train(trainSet, label, bands);

// var classified = input.classify(classifier);

var landcoverPalette= [
    '2d8832',
    '04f613',
    'b98c00',
    '999999',
    //'00ffff',
  ]
  
Map.addLayer(classified.clip(roi), {palette: landcoverPalette, min:0, max:3}, 'Classif. RF');