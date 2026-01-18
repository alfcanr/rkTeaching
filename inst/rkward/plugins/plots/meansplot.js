// author: Alfredo Sánchez Alberca (asalber@ceu.es)

include("../common/common_functions.js")
include("../common/filter.js")

// globals
var dataframe,
variables,
variablesName,
groups,
groupsName,
getPoints,
points,
getConfInt,
confLevel;

function setGlobalVars() {
  variables = getList("variables");
  variablesName = getList("variables.shortname");
  dataframe = getDataframe(variables);
  grouped = getBoolean("grouped");
  groups = getList("groups");
  groupsName = getList("groups.shortname");
  getPoints = getBoolean("points");
  getConfInt = getBoolean("frameConfInt.checked");
  confLevel = getString("conflevel");
}

function preprocess() {
  setGlobalVars();
  echo('library(tidyverse)\n');
}

function calculate() {
  // Filter
  filter();
  // Prepare data frame
  echo('plot <- ' + dataframe + ' |>\n');
  if (grouped) {
    echo('\tmutate(' + groupsName.join(".") + ' = interaction(' + groupsName.join(", ") + ')) |>\n');
  }
  echo('\tpivot_longer(cols = c(' + variablesName.join(", ") + '), names_to = "Variable", values_to = "Value") |>\n');

  if (grouped) {
    // UPDATED LINE: Changed 'colour = Variable' to 'colour = ' + groupsName.join(".")
    echo('\tggplot(aes(x = ' + groupsName.join(".") + ', y = Value, colour = ' + groupsName.join(".") + ')) +\n');
  } else {
    echo('\tggplot(aes(x = Variable, y = Value, color = I("#FF9999"))) +\n');
  }

  // Set points
  if (getPoints) {
    echo('\tgeom_point(position = position_dodge(0.5)) +\n');
  }
  echo('\tstat_summary(fun.data = ~ mean_cl_normal(., conf.int = ' + confLevel + '), ');
  // Set confidence intervals
  if (getConfInt) {
    echo('geom = "pointrange", ');
  } else {
    echo('geom = "point", ');
  }
  echo('position = position_dodge(width = 0.5))');
  echo(getString("plotOptions.code.calculate") + '\n');
}

function printout() {
  doPrintout(true);
}

function preview() {
  preprocess();
  calculate();
  doPrintout(false);
}

function doPrintout(full) {
  // Print header
  if (full) {
    header = new Header(i18n("Means plot of %1", variablesName.join(", ")));
    header.add(i18n("Data frame"), dataframe);
    header.add(i18n("Variables"), variablesName.join(", "));
    if (grouped) {
      header.add(i18n("Grouping variable(s)"), groupsName.join(", "));
    }
    if (filtered) {
      header.addFromUI("condition");
    }
    header.print();
    echo('rk.graph.on()\n');
  }
  // Plot
  echo('try ({\n');
  echo('print(plot)\n');
  echo('})\n');
  if (full) {
    echo('rk.graph.off ()\n');
  }
}
