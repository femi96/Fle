(function()
{
	var app = angular.module('app', ['ngFileUpload']);
	app.filter('iif', function (){
		return function(input, trueValue, falseValue){
			return input ? trueValue : falseValue;
		};
	});
	app.controller('dat_controller', ['$scope', 'Upload', function ($scope, Upload){
		//Data Upload
		this.cur_file = null;
		
		//Data Retrieval
		this.inp_file_id = 'Use 1436817534058';

		this.res_show = false;
		this.inp_res_ck = [];
		this.inp_res_val = [];

		this.fie_show = false;
		this.inp_fie_ck = [];

		this.disp_cats = [];
		this.disp_data = 'Click update to update data';

		//Data Math
		this.apply_cat = [];

		this.apply_cats = [];
		this.apply_data_disp = 'Click update to update data';
		this.apply_data = '';
		this.apply_opts = ['std dev from mean'];

		//Data Visual
		this.vis_data = ''
		this.vis_cats = [];

		this.opt_show = false;
		this.vis_opts = ['bar graph', 'line graph', 'scatter plot', 'pie chart'];
		this.vis_opt = null;

		this.met_show = false;
		this.vis_cats_num = [];
		this.vis_cats_date = [];
		this.vis_cats_string = [];

		this.met_one = '';
		this.met_one_opts = [];
		this.met_one_opt = '';
		this.met_two = '';
		this.met_two_opts = [];
		this.met_two_opt = '';
		
		this.vis_div = document.getElementsByClassName("vis-con")[0];
		this.tt_div = d3.select(this.vis_div)
			.append("div")
			.attr("class","tooltip")
			.style("opacity", 0);
		this.vis_title = d3.select(this.vis_div)
			.append("div")
			.attr("class","vis_title");
		this.svg = d3.select(this.vis_div)
			.append("svg")
			.attr("width", this.vis_div.offsetWidth-10)
			.attr("height", this.vis_div.offsetHeight-10-35)
			.attr("class","svg");

		//Upload Functions
		$scope.$watch('files', function (){
			$scope.upload($scope.files);
		});
		$scope.new_cur_file = function(file)
		{
			console.log("New File: "+file.name)
			$scope.datcon.cur_file = file;
			console.log("Confirmed: "+$scope.datcon.cur_file.name)
		}
		$scope.upload_cur_file = function()
		{
			var key = (new Date().getTime()).toString();
			var file = $scope.datcon.cur_file;
			$scope.datcon.inp_file_id = file;
			console.log("Uploading: "+file.name)
			console.log("Upload Key: "+key)

			if(file.name.split('.').pop() == 'csv') //if csv
			{
				var reader = new FileReader();
				reader.readAsText(file);
				reader.onload = function(event)
				{
					console.log("Uploading .csv")
					var res = event.target.result;
					var data = $.csv.toArrays(res);
					data = $scope.format_dat_csv(data,key)
					$.ajax({url: "https://api.mongolab.com/api/1/databases/fle_test/collections/base?apiKey=Wsye_E8EwSVnh_GWHyZMfIqk4CuiU8g9",
					data: JSON.stringify(data),
					type: "POST",
					contentType:"application/json"});
				}
			}
		}
		$scope.format_dat_csv = function(data,key)
		{
			var cat = data[0]
			var new_objs = []
			for(var ind in data)
			{
				if(ind == 0)
				{
					continue
				}
				var obj = {}
				obj.file_id = key;
				for(var c in cat)
				{
					obj[cat[c]] = data[ind][c]
				}
				new_objs.push(obj)
			}
			return new_objs
		}

	//Data Download Functions
		$scope.update_disp_cats = function()
		{
			var d = $scope.datcon;
			var url = "https://api.mongolab.com/api/1/databases/fle_test/collections/base?l=1&q={'file_id':'"+d.inp_file_id+"'}&apiKey=Wsye_E8EwSVnh_GWHyZMfIqk4CuiU8g9"
			$.getJSON(url,function(data)
			{
				if(data[0] == null)
				{
					d.disp_cats = []
					$scope.$apply();
					return
				}
				d.disp_cats = Object.keys(data[0]).slice(2)
				$scope.$apply();
			})
		}
		$scope.update_disp = function()
		{
			var d = $scope.datcon;
			var q = {file_id: d.inp_file_id}
			var f = {}
			for(var c in d.disp_cats)
			{
				if(d.inp_res_ck[c])
				{
					q[d.disp_cats[c]] = d.inp_res_val[c]
				}
				if(d.inp_fie_ck[c])
				{
					f[d.disp_cats[c]] = 1
				}
			}
			var url = "https://api.mongolab.com/api/1/databases/fle_test/collections/base?l=10000&f="+JSON.stringify(f)+"&q="+JSON.stringify(q)+"&apiKey=Wsye_E8EwSVnh_GWHyZMfIqk4CuiU8g9"
			$.getJSON(url,function(data)
			{
				d.disp_data = JSON.stringify(data);
				d.apply_data = data;
				d.apply_cats = $scope.get_apply_cats(data);
				$scope.$apply();
			})
		}

	//"Apply Function" Functions
		$scope.get_apply_cats = function(data)//Update vis cats on data change
		{
			var fin = [];
			var pre = Object.keys(data[0])
			var num = pre.indexOf("file_id")
			if(num == -1)
			{
				pre = pre.slice(1)
			}
			else
			{
				pre = pre.slice(2)
			}
			for(var ind in pre)
			{
				if($scope.acat_is_num(pre[ind]))
				{
					fin.push(pre[ind]);
				}
			}
			return fin;
		}
		$scope.new_apply_cat = function()
		{
			/*new cat object structure
			name = category name
			opt = type of function applied
			*/
			var d = $scope.datcon;
			var obj = {};
			obj.na = 'defualtname';
			obj.opt = null;
			obj.cat = null;
			obj.show = true;
			d.apply_cat.push(obj);
		}
		$scope.update_apply = function()
		{
			var d = $scope.datcon;
			for(var ind in d.apply_cat)
			{
				var a = d.apply_cat[ind]
				if(a.opt == null || a.cat == null)
				{
					continue;
				}
				if(a.opt == 'std dev from mean')
				{
					$scope.apply_stddevfrommean(a)
				}
			}
			d.apply_data_disp = JSON.stringify(d.apply_data);
			d.vis_data = d.apply_data;
			d.vis_cats = $scope.get_vis_cats(d.apply_data);
			d.apply_cats = $scope.get_apply_cats(d.apply_data);
			$scope.update_vis_opts()
		}
		$scope.apply_stddevfrommean = function(a)
		{
			var d = $scope.datcon;
			var count = 0;
			var total = 0;
			for(var ind in d.apply_data)
			{
				count += 1;
				total += getFloat(d.apply_data[ind][a.cat]);
			}
			var mean = total/count;
			count = 0;
			total = 0;
			for(var ind in d.apply_data)
			{
				count += 1;
				total += Math.pow((getFloat(d.apply_data[ind][a.cat]) - mean),2);
			}
			var sqmean = total/count;
			var stddev = Math.sqrt(sqmean);
			for(var ind in d.apply_data)
			{
				d.apply_data[ind][a.na] = ((getFloat(d.apply_data[ind][a.cat]) - mean)/stddev);
			}
		}

	//Visualization Functions
		$scope.get_vis_cats = function(data)//Update vis cats on data change
		{
			var fin = Object.keys(data[0])
			var num = fin.indexOf('file_id')
			if(num == -1)
			{
				return fin.slice(1)
			}
			else
			{
				return fin.slice(2)
			}
		}
		$scope.update_vis_opts = function()//Upate possible settings on vis type change
		{
			var d = $scope.datcon;
			d.met_one_opt = '';
			d.met_one_opts = [];
			d.met_two_opt = '';
			d.met_two_opts = [];
			d.vis_cats_num = [];
			d.vis_cats_date = [];
			d.vis_cats_string = [];
			for(var ind in d.vis_cats)
			{
				if($scope.cat_is_num(d.vis_cats[ind]))
				{
					d.vis_cats_num.push(d.vis_cats[ind])
				}
				if($scope.cat_is_date(d.vis_cats[ind]))
				{
					d.vis_cats_date.push(d.vis_cats[ind])
				}
				d.vis_cats_string.push(d.vis_cats[ind])
			}
			if(d.vis_opt == 'bar graph')
			{
				d.met_one = 'Bars: Num/Date/String';
				d.met_one_opts.push('None')
				for(var ind in d.vis_cats)
				{
					d.met_one_opts.push(d.vis_cats[ind])
				}
				d.met_one_opt = '';
				d.met_two = 'Values: Num';
				d.met_two_opts.push('None')
				for(var ind in d.vis_cats_num)
				{
					d.met_two_opts.push(d.vis_cats_num[ind])
				}
				d.met_two_opt = '';
			}
			if(d.vis_opt == 'line graph')
			{
				d.met_one = 'X-Axis: Num/Date';
				for(var ind in d.vis_cats)
				{
					if(d.vis_cats_num.indexOf(d.vis_cats[ind]) != -1 || d.vis_cats_date.indexOf(d.vis_cats[ind]) != -1)
					{
						d.met_one_opts.push(d.vis_cats[ind])
					}
				}
				d.met_one_opt = '';
				d.met_two = 'Y-Axis: Num/Date';
				for(var ind in d.vis_cats)
				{
					if(d.vis_cats_num.indexOf(d.vis_cats[ind]) != -1 || d.vis_cats_date.indexOf(d.vis_cats[ind]) != -1)
					{
						d.met_two_opts.push(d.vis_cats[ind])
					}
				}
				d.met_two_opt = '';
			}
			if(d.vis_opt == 'scatter plot')
			{
				d.met_one = 'X-Axis: Num/Date';
				for(var ind in d.vis_cats)
				{
					if(d.vis_cats_num.indexOf(d.vis_cats[ind]) != -1 || d.vis_cats_date.indexOf(d.vis_cats[ind]) != -1)
					{
						d.met_one_opts.push(d.vis_cats[ind])
					}
				}
				d.met_one_opt = '';
				d.met_two = 'Y-Axis: Num/Date';
				for(var ind in d.vis_cats)
				{
					if(d.vis_cats_num.indexOf(d.vis_cats[ind]) != -1 || d.vis_cats_date.indexOf(d.vis_cats[ind]) != -1)
					{
						d.met_two_opts.push(d.vis_cats[ind])
					}
				}
				d.met_two_opt = '';
			}
			if(d.vis_opt == 'pie chart')
			{
				d.met_one = 'Slices: Num/Date/String';
				d.met_one_opts.push('None')
				for(var ind in d.vis_cats)
				{
					d.met_one_opts.push(d.vis_cats[ind])
				}
				d.met_one_opt = '';
				d.met_two = 'Values: Num';
				d.met_two_opts.push('None')
				for(var ind in d.vis_cats_num)
				{
					d.met_two_opts.push(d.vis_cats_num[ind])
				}
				d.met_two_opt = '';
			}
		}
		$scope.update_vis = function()//Update Visual
		{
			var d = $scope.datcon;
			d3.select(d.vis_div).selectAll("svg").remove();
			if(d.vis_opt == 'bar graph')
			{
				$scope.update_bar_graph()
			}
			if(d.vis_opt == 'line graph')
			{
				$scope.update_line_graph()
			}
			if(d.vis_opt == 'scatter plot')
			{
				$scope.update_scatter_plot()
			}
			if(d.vis_opt == 'pie chart')
			{
				$scope.update_pie_chart()
			}
		}
		$scope.update_bar_graph = function()
		{
			var d = $scope.datcon;
			var w = d.vis_div.offsetWidth-10;
			var h = d.vis_div.offsetHeight-10-35;
			d.svg = d3.select(d.vis_div)
				.append("svg")
				.attr("width", w)
				.attr("height", h)
				.attr("class","svg");
			if(d.met_one_opt == '')
			{
				d.vis_title.html('Cannot display data. Invalid metric 1.')
				return
			}
			var isnum = $scope.cat_is_num(d.met_two_opt);

			var param = [];
			var count = [];
			if(isnum)
			{
				if(d.met_one_opt == null || d.met_one_opt == 'None')
				{
					d.vis_title.html('Displaying '+d.met_two_opt+' for each item:')
					for(var ind in d.vis_data)
					{
						param.push('Item')
						count.push(getFloat(d.vis_data[ind][d.met_two_opt]))
					}
				}
				else
				{
					d.vis_title.html('Displaying '+d.met_two_opt+' for each '+d.met_one_opt+':')
					for(var ind in d.vis_data)
					{
						var i = param.indexOf(d.vis_data[ind][d.met_one_opt])
						if(i > -1)
						{
							count[i] = count[i]+getFloat(d.vis_data[ind][d.met_two_opt])
						}
						else
						{
							param.push(d.vis_data[ind][d.met_one_opt])
							count.push(getFloat(d.vis_data[ind][d.met_two_opt]))
						}
					}
				}
			}
			else
			{
				d.vis_title.html('Displaying number of each '+d.met_one_opt+':')
				for(var ind in d.vis_data)
				{
					var i = param.indexOf(d.vis_data[ind][d.met_one_opt])
					if(i > -1)
					{
						count[i] = count[i]+1
					}
					else
					{
						param.push(d.vis_data[ind][d.met_one_opt])
						count.push(1)
					}
				}
			}
			var len = param.length;
			var ma = Math.max.apply(Math,count)

			var disp_h = h-20;//-margin
			var disp_w = w-30;
			var w_unit = disp_w/len;
			var h_unit = disp_h/ma;
			var main = d.svg.append('g')
				.attr('transform', 'translate('+20+','+(-20)+')')
				.attr('width', disp_w)
				.attr('height', disp_h)
				.attr('class', 'main')
			main.selectAll("rect").data(param).enter().append('rect')
				.attr("fill", function(o){return getColor([192,255,192]);})
				.attr("x", function(o,i){return i*w_unit})
				.attr("y", function(o,i){return h-(count[i] * h_unit);})
				.attr("width", function(o){return w_unit})
				.attr("height", function(o,i){return count[i] * h_unit;})
				.attr("stroke", "#222")
				.attr("stroke-width", 1)
				.on("mouseover", function(o,i)
				{
					d.tt_div.transition().duration(200).style("opacity", 0.97)
					d.tt_div.html(param[i]+': '+count[i]).style("left", d3.event.x+4).style("top", d3.event.y+12)
				})
				.on("mouseout", function(o)
				{
					d.tt_div.transition().duration(600).style("opacity", 0)
					d.tt_div.transition().delay(600).duration(0).style("left", '-1000px').style("top", '-1000px')
				});
			var sidelabel = ""
			if(isnum)
			{
				sidelabel = d.met_two_opt
			}
			else
			{
				sidelabel = "amount"
			}
			var botlabel = ""
			if(d.met_two_opt == null)
			{
				botlabel = "item"
			}
			else
			{
				botlabel = d.met_one_opt
			}
			main.append("text")
				.attr("class", "label")
				.attr("transform", "rotate(-90)")
				.attr("y", -18)
				.attr("x", -(disp_h/2 + 20))
				.attr("dy", ".71em")
				.style("text-anchor", "middle")
				.text(sidelabel);
			main.append("text")
				.attr("class", "label")
				.attr("y", (disp_h+24))
				.attr("x", (disp_w/2+20))
				.attr("dy", ".71em")
				.style("text-anchor", "middle")
				.text(botlabel);
		}

		$scope.update_line_graph = function()
		{
			var d = $scope.datcon;
			var w = d.vis_div.offsetWidth-10;
			var h = d.vis_div.offsetHeight-10-35;
			d.svg = d3.select(d.vis_div)
				.append("svg")
				.attr("width", w)
				.attr("height", h)
				.attr("class","svg");
			var disp_h = h-35;//-margin
			var disp_w = w-60;

			var main = d.svg.append('g')
				.attr('transform', 'translate('+45+','+10+')')
				.attr('width', disp_w)
				.attr('height', disp_h)
				.attr('class', 'main')
			if(d.met_one_opt == null || d.met_two_opt == null)
			{
				d.vis_title.html('Cannot display data. Invalid metric(s).')
				return
			}
			if(!($scope.cat_is_num(d.met_one_opt) || $scope.cat_is_date(d.met_one_opt)) || !($scope.cat_is_num(d.met_two_opt) || $scope.cat_is_date(d.met_two_opt)))
			{
				d.vis_title.html('Cannot display '+d.met_one_opt+' and '+d.met_two_opt+'. Requires numerical metrics.')
				return
			}
			d.vis_title.html('Displaying '+d.met_one_opt+' on x-axis vs '+d.met_two_opt+' on y-axis:')

			var set = [];
			for(var ind in d.vis_data)
			{
				var x = 0
				if($scope.cat_is_date(d.met_one_opt))
				{
					x = getFloat(Date.parse(d.vis_data[ind][d.met_one_opt]))
				}
				else
				{
					x = getFloat(d.vis_data[ind][d.met_one_opt])
				}
				var y = 0
				if($scope.cat_is_date(d.met_two_opt))
				{
					y = getFloat(Date.parse(d.vis_data[ind][d.met_two_opt]))
				}
				else
				{
					y = getFloat(d.vis_data[ind][d.met_two_opt])
				}
				set.push([x,y])
			}
			set = set.sort(compNum);
			var newset = [];
			for(var ind in set)
			{
				var f = newset.length-1;
				if(f == -1)
				{
					newset.push([set[ind][0],[set[ind][1]]])
					continue
				}
				if(set[ind][0] == newset[f][0])
				{
					newset[f][1].push(set[ind][1])
					continue
				}
				else
				{
					newset.push([set[ind][0],[set[ind][1]]])
					continue
				}
			}
			for(var ind in newset)
			{
				var a = 0;
				var c = 0;
				for(var ssi in newset[ind][1])
				{
					a += newset[ind][1][ssi]
					c += 1
				}
				newset[ind][1] = a/c;
			}
			set = newset

			var minx = 0;
			var miny = 0;

			if($scope.cat_is_date(d.met_one_opt))
			{
				minx = d3.min(set, function(o) { return o[0]; })
			}
			if($scope.cat_is_date(d.met_two_opt))
			{
				miny = d3.min(set, function(o) { return o[0]; })
			}

			var x = d3.scale.linear()
				.domain([minx, d3.max(set, function(o) { return o[0]; })])
				.range([ 0, disp_w ]);
	
			var y = d3.scale.linear()
				.domain([miny, d3.max(set, function(o) { return o[1]; })])
				.range([ disp_h, 0 ]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient('bottom')
				.tickFormat(function(o)
					{
						if($scope.cat_is_date(d.met_one_opt))
						{
							return (new Date(o)).getFullYear()
						}
						if(o.toString().length > 3)
						{
							return o.toExponential()
						}
						else
						{
							return o
						}
					});
			main.append('g')
				.attr('transform', 'translate(0,'+disp_h+')')
				.attr('class', 'main axis date')
				.call(xAxis)
			.append("text")
				.attr("class", "label")
				.attr("x", disp_w)
				.attr("y", -6)
				.style("text-anchor", "end")
				.text(d.met_one_opt);

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient('left')
				.tickFormat(function(o)
					{
						if($scope.cat_is_date(d.met_two_opt))
						{
							return (new Date(o)).getFullYear()
						}
						if(o.toString().length > 3)
						{
							return o.toExponential()
						}
						else
						{
							return o
						}
					});
			main.append('g')
				.attr('transform', 'translate(0,0)')
				.attr('class', 'main axis date')
				.call(yAxis)
			.append("text")
				.attr("class", "label")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(d.met_two_opt);

			var line = d3.svg.line()
				.x(function(o) { return x(o[0]); })
				.y(function(o) { return y(o[1]); });

			main.append("path")
				.datum(set)
				.attr("class", "line")
				.attr("stroke", "#649464") //#7ABA7A
				.attr("fill", "none")
				.attr("d", line);
		}

		$scope.update_scatter_plot = function()
		{
			var d = $scope.datcon;
			var w = d.vis_div.offsetWidth-10;
			var h = d.vis_div.offsetHeight-10-35;
			d.svg = d3.select(d.vis_div)
				.append("svg")
				.attr("width", w)
				.attr("height", h)
				.attr("class","svg");
			var disp_h = h-35;//-margin
			var disp_w = w-60;

			var main = d.svg.append('g')
				.attr('transform', 'translate('+45+','+10+')')
				.attr('width', disp_w)
				.attr('height', disp_h)
				.attr('class', 'main')
			if(d.met_one_opt == null || d.met_two_opt == null)
			{
				d.vis_title.html('Cannot display data. Invalid metric(s).')
				return
			}
			if(!($scope.cat_is_num(d.met_one_opt) || $scope.cat_is_date(d.met_one_opt)) || !($scope.cat_is_num(d.met_two_opt) || $scope.cat_is_date(d.met_two_opt)))
			{
				d.vis_title.html('Cannot display '+d.met_one_opt+' and '+d.met_two_opt+'. Requires numerical metrics.')
				return
			}
			d.vis_title.html('Displaying '+d.met_one_opt+' on x-axis vs '+d.met_two_opt+' on y-axis:')

			var set = [];
			for(var ind in d.vis_data)
			{
				var x = 0
				if($scope.cat_is_date(d.met_one_opt))
				{
					x = getFloat(Date.parse(d.vis_data[ind][d.met_one_opt]))
				}
				else
				{
					x = getFloat(d.vis_data[ind][d.met_one_opt])
				}
				var y = 0
				if($scope.cat_is_date(d.met_two_opt))
				{
					y = getFloat(Date.parse(d.vis_data[ind][d.met_two_opt]))
				}
				else
				{
					y = getFloat(d.vis_data[ind][d.met_two_opt])
				}
				set.push([x,y])
			}
			set = set.sort(compNum);

			var minx = 0;
			var miny = 0;

			if($scope.cat_is_date(d.met_one_opt))
			{
				minx = d3.min(set, function(o) { return o[0]; })
			}
			if($scope.cat_is_date(d.met_two_opt))
			{
				miny = d3.min(set, function(o) { return o[0]; })
			}

			var x = d3.scale.linear()
				.domain([minx, d3.max(set, function(o) { return o[0]; })])
				.range([ 0, disp_w ]);
	
			var y = d3.scale.linear()
				.domain([miny, d3.max(set, function(o) { return o[1]; })])
				.range([ disp_h, 0 ]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient('bottom')
				.tickFormat(function(o)
					{
						if($scope.cat_is_date(d.met_one_opt))
						{
							return (new Date(o)).getFullYear()
						}
						if(o.toString().length > 3)
						{
							return o.toExponential()
						}
						else
						{
							return o
						}
					});
			main.append('g')
				.attr('transform', 'translate(0,'+disp_h+')')
				.attr('class', 'main axis date')
				.call(xAxis)
			.append("text")
				.attr("class", "label")
				.attr("x", disp_w)
				.attr("y", -6)
				.style("text-anchor", "end")
				.text(d.met_one_opt);

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient('left')
				.tickFormat(function(o)
					{
						if($scope.cat_is_date(d.met_two_opt))
						{
							return (new Date(o)).getFullYear()
						}
						if(o.toString().length > 3)
						{
							return o.toExponential()
						}
						else
						{
							return o
						}
					});
			main.append('g')
				.attr('transform', 'translate(0,0)')
				.attr('class', 'main axis date')
				.call(yAxis)
			.append("text")
				.attr("class", "label")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(d.met_two_opt);

			var g = main.append("svg:g");
			g.selectAll("circle").data(set).enter().append('circle')
				.attr("fill", function(o){return getColor([192,255,192]);})
				.attr("cx", function(o,i){return x(o[0]);})
				.attr("cy", function(o,i){return y(o[1]);})
				.attr("r", 3.5)
				.attr("class", "dot")
				.attr("stroke", "#222")
				.attr("stroke-width", 1)
				.on("mouseover", function(o,i)
				{
					d.tt_div.transition().duration(200).style("opacity", 0.97)
					d.tt_div.html(d.met_one_opt+': '+o[0]+'<br>'+d.met_two_opt+': '+o[1]).style("left", d3.event.x+4).style("top", d3.event.y+12)
				})
				.on("mouseout", function(o)
				{
					d.tt_div.transition().duration(600).style("opacity", 0)
					d.tt_div.transition().delay(600).duration(0).style("left", '-1000px').style("top", '-1000px')
				});
		}

		$scope.update_pie_chart = function()
		{
			var d = $scope.datcon;
			var w = d.vis_div.offsetWidth-10;
			var h = d.vis_div.offsetHeight-10-35;
			d.svg = d3.select(d.vis_div)
				.append("svg")
				.attr("width", w)
				.attr("height", h)
				.attr("class","svg")
				.append("g")
				.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
			if(d.met_one_opt == null)
			{
				d.vis_title.html('Cannot display data. Invalid metric 1.')
				return
			}
			var isnum = $scope.cat_is_num(d.met_two_opt)
			//
			var param = [];
			var count = [];
			if(isnum)
			{
				if(d.met_one_opt == null || d.met_one_opt == 'None')
				{
					d.vis_title.html('Displaying '+d.met_two_opt+' for each item:')
					//
					for(var ind in d.vis_data)
					{
						param.push('Item')
						count.push(getFloat(d.vis_data[ind][d.met_two_opt]))
					}
				}
				else
				{
					d.vis_title.html('Displaying '+d.met_two_opt+' for each '+d.met_one_opt+':')
					//
					for(var ind in d.vis_data)
					{
						var i = param.indexOf(d.vis_data[ind][d.met_one_opt])
						if(i > -1)
						{
							count[i] = count[i]+getFloat(d.vis_data[ind][d.met_two_opt])
						}
						else
						{
							param.push(d.vis_data[ind][d.met_one_opt])
							count.push(getFloat(d.vis_data[ind][d.met_two_opt]))
						}
					}
				}
			}
			else
			{
				d.vis_title.html('Displaying number of each '+d.met_one_opt+':')
				//then count
				for(var ind in d.vis_data)
				{
					var i = param.indexOf(d.vis_data[ind][d.met_one_opt])
					if(i > -1)
					{
						count[i] = count[i]+1
					}
					else
					{
						param.push(d.vis_data[ind][d.met_one_opt])
						count.push(1)
					}
				}
			}
			var radius = Math.min(h,w)/2
			var arc = d3.svg.arc()
				.outerRadius(radius - 10)
				.innerRadius(radius/2 - 5);

			var pie = d3.layout.pie()
				.sort(null)
				.value(function(o){return o;});

			var g = d.svg.selectAll(".slice").data(pie(count)).enter().append('g')
				.attr("class", "slice");

			//color theory ftw
			//

			g.append("path")
				.attr("d", arc)
				.style("fill", function(o){return getColor([192,255,192]);})
				.attr("stroke", "#222")
				.attr("stroke-width", 1)
				.on("mouseover", function(o,i)
				{
					d.tt_div.transition().duration(200).style("opacity", 0.97)
					d.tt_div.html(param[i]+': '+count[i]).style("left", d3.event.x+4).style("top", d3.event.y+12)
				})
				.on("mouseout", function(o)
				{
					d.tt_div.transition().duration(600).style("opacity", 0)
					d.tt_div.transition().delay(600).duration(0).style("left", '-1000px').style("top", '-1000px')
				});

			/*g.append("text")
				.attr("transform", function(o){return "translate(" + arc.centroid(o) + ")";})
				.attr("dy", ".35em")
				.style("text-anchor", "middle")
				.text(function(o,i){return param[i];});*/
		}

	//Support Functions
		$scope.upload = function(files){
			if (files && files.length){
				for (var i = 0; i < files.length; i++){
					var file = files[i];
					Upload.upload({
						url: 'upload/url',
						fields: {'username': $scope.username},
						file: file
					}).progress(function (evt){
						var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
						console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
					}).success(function (data, status, headers, config){
						console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
					});
				}
			}
		};
		$scope.acat_is_num = function(cat)
		{
			var d = $scope.datcon;
			for(var ind in d.apply_data)
			{
				if(!isNaN(d.apply_data[ind][cat]))
				{
					continue
				}
				if(d.apply_data[ind][cat] == '')
				{
					continue
				}
				return false;
			}
			return true
		}
		$scope.acat_is_date = function(cat)
		{
			var d = $scope.datcon;
			for(var ind in d.apply_data)
			{
				if(!isNaN(d.apply_data[ind][cat]))
				{
					return false;
				}
				if(isNaN(Date.parse(d.apply_data[ind][cat])))
				{
					return false;
				}
			}
			return true
		}
		$scope.cat_is_num = function(cat)
		{
			var d = $scope.datcon;
			for(var ind in d.vis_data)
			{
				if(!isNaN(d.vis_data[ind][cat]))
				{
					continue
				}
				if(d.vis_data[ind][cat] == '')
				{
					continue
				}
				return false;
			}
			return true
		}
		$scope.cat_is_date = function(cat)
		{
			var d = $scope.datcon;
			for(var ind in d.vis_data)
			{
				if(!isNaN(d.vis_data[ind][cat]))
				{
					return false;
				}
				if(isNaN(Date.parse(d.vis_data[ind][cat])))
				{
					return false;
				}
			}
			return true
		}
	}]);
})();

function getColor(mixer)
{
	var r = Math.floor(Math.random()*255)
	var g = Math.floor(Math.random()*255)
	var b = Math.floor(Math.random()*255)
	if(mixer != null)
	{
		r = Math.floor(0.5*(mixer[0]+r))
		g = Math.floor(0.5*(mixer[1]+b))
		b = Math.floor(0.5*(mixer[2]+g))
	}
	var fin = 'rgb('+r+','+g+','+b+')'
	return fin
}
function getFloat(inp)
{
	if(isNaN(parseFloat(inp)))
	{
		return 0
	}
	else
	{
		return parseFloat(inp)
	}
}
function compNum(a,b)
{
	if(a[0] < b[0])
	{
		return -1;
	}
	if(a[0] > b[0])
	{
		return 1;
	}
	return 0;
}