// author: Alfredo Sánchez Alberca (asalber@ceu.es)

var q,
	min,
	max;

function setGlobals() {
	q = getString("q");
	min = getString("min");
	max = getString("max");
	tail = getString("tail");
	plot = getBoolean("plot");
}

function preprocess() {
	setGlobals();
	echo('library(tidyverse)\n');
	echo('library(knitr)\n');
	echo('library(kableExtra)\n');
}

function calculate() {
	echo('prob <- (punif(q = c(' + q + '), min = ' + min + ', max = ' + max + ', ' + tail + '))\n');
	echo('result <- tibble(' + i18n("Values") + ' = c(' + q + '), ' + i18n("Cumulative Prob") + ' = prob)\n');
}

function printout() {
	// Header
	header = new Header(i18n("Continuous uniform cumulative probabilities U(%1,%2)", min, max));	
	header.add(i18n("Minimum"), min);
	header.add(i18n("Maximum"), max);
	if (tail === "lower.tail=TRUE") {
		header.add(i18n("Accumulation tail"), i18n("Left (&le;)"));
	} else {
		header.add(i18n("Accumulation tail"), i18n("Right (>)"));
	}
	header.print();
	// Results
	echo('rk.print.literal(result |>\n');
    echo('\tkable("html", align = "c", escape = F) |>\n');
    echo('\tkable_styling(bootstrap_options = c("striped", "hover"), full_width = FALSE)\n');
    echo(')\n'); 
	// Plot
	if (plot) {
		if (tail == "lower.tail=TRUE") {
			echo('x <- seq(' + min + ',' + q + '[1], length.out= 2)\n');
		} else {
			echo('x <- seq(' + q + '[1],' + max + ', length.out= 2)\n');
		}
		echo('y <- dunif(x,' + min + ',' + max + ')\n');
		echo('rk.graph.on()\n');
		echo('try ({\n');
		echo('p <- qplot(xlim=c(' + min + ',' + max + '), geom="blank") + geom_area(aes(x=c(x[1],x,x[2]), c(0,y,0)), fill=I("#FF9999"), alpha=0.5) + stat_function(fun=dunif, n=2, colour="#FF5555", args=list(min=' + min + ', max=' + max + ')) + xlab(expression(italic("X"))) + ylab(expression(paste(' + i18n("Density") + '," ",italic(f(x))))) + scale_x_continuous(breaks=c(' + min + ',' + q + '[1],' + max + '))');
		if (tail == "lower.tail=TRUE") {
			echo(' + labs(title=paste("P(X<",' + q + '[1], ")=", round(result[1],4)))\n');
		} else {
			echo(' + labs(title=paste("P(X>",' + q + '[1], ")=", round(result[1],4)))\n');
		}
		echo('print(p)\n');
		echo('})\n');
		echo('rk.graph.off()\n');
	}
}
