// preload table data
let results;
let runner=[];
let aidstationdist=[];
let slider;
let racedistance=0;
let racestate=[]; // position of every runner as % of course, at a timestep in the race.

let graphwidth=1000;
let graphheight=700;
let xoffset=30;
let yoffset=20;
let timesteps=1000; // granularity of time, e.g 100 time steps on the x axis

function preload() {
	results = loadTable('ThamesPath100Results.csv','csv');
}

function runnerdistanceattime(r,t) {
	for (let i=0;i<aidstationdist.length;i++){
		if (runner[r][i+2]>t) {
			lasttime=runner[r][i+2-1];
			nexttime=runner[r][i+2];
			lastdist=aidstationdist[i-1];
			nextdist=aidstationdist[i];
			return(t-lasttime)/(nexttime-lasttime)*(nextdist-lastdist)+lastdist;
		}
	}
	return racedistance;
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(60);
	colorMode(HSB, 255, 255, 255, 1);
	slider = createSlider(0.0, timesteps-1, 0, 1);
  	slider.position(xoffset, 750);
	  slider.style('width', '1000px');
	  
	for (let c = 2; c < 15; c++) {
		aidstationdist[c-2]=results.getNum(0,c);
	}
	for (let i=0;i<results.getRowCount()-1;i++) {
		runner[i]=[]
		for (let c = 0; c < 2; c++) {
			runner[i][c] = results.getString(i+1, c)
		  }
		for (let c = 2; c < results.getColumnCount(); c++) {
			runner[i][c] = results.getString(i+1, c)
		}
	}
	racedistance=aidstationdist[12];

	for (let i=0;i<timesteps;i++) {
		racestate[i]=[];
		for (let r=0;r<runner.length;r++) {
			racestate[i][r]=runnerdistanceattime(r,i/timesteps);
		}
	}
}

function draw() {
	rect(xoffset, yoffset, graphwidth, graphheight);
	for (let a=0;a<aidstationdist.length;a++) {
		stroke(1,0,0,0.1);
		x=aidstationdist[a]/racedistance*graphwidth+xoffset;
		line(x,graphheight+yoffset,x,yoffset);
	}
	for (let r=0;r<runner.length;r++) {
		x=racestate[slider.value()][r]/racedistance*graphwidth+xoffset;
		stroke(runner[r][results.getColumnCount()-1]*255,255,255,0.5); // colour by finish time
		stroke(map((racestate[min(slider.value()+1,timesteps-1)][r]-racestate[slider.value()][r]),0,0.4,0,255),255,255,0.5); // colour pace
		line(x,graphheight+yoffset,x,graphheight+yoffset-500);
	}
	text(str(slider.value()/timesteps*28.0),50,20+yoffset)

	//text(str((racestate[slider.value()+1][0]-racestate[slider.value()][0])),50,80+yoffset)

}