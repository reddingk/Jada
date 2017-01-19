'use strict';

var routes = angular.module('routes', ['ui.router']);
var directives = angular.module('directives', []);
var components = angular.module('components', ['ui.bootstrap', 'ngAnimate', 'ngSanitize']);
var services = angular.module('services',[]);

var JadenApp = angular.module('JadenApp', ['ngMaterial', 'ngAnimate', 'ui.router', 'directives', 'components',	'services', 'routes']);
