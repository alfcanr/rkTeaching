// author: Alfredo Sánchez Alberca (asalber@ceu.es)

include("../common/common_functions.js")
include("../common/filter.js")

// globals
var row,
  rowName,
  col,
  colName,
  dataframe,
  observed,
  percentages,
  expected;

function setGlobalVars() {
  row = getString("row");
  rowName = getString("row.shortname");
  dataframe = getDataframe(row);
  col = getString("col");
  colName = getString("col.shortname");
  observed = getBoolean("observed");
  percentages = getBoolean("percentages");
  expected = getBoolean("expected");
  groupsName = getList("groups.shortname");
  grouped = getBoolean("grouped");
  groups = getList("groups");
}

function preprocess() {
  setGlobalVars();
  echo('require(plyr)\n');
}

function calculate() {
  // Filter
  filter();
  // Grouped mode
  if (grouped) {
    echo(dataframe + ' <- transform(' + dataframe + ', .groups=interaction(' + dataframe + '[,c(' + groupsName.map(quote) + ')]))\n');
    echo('table <- dlply(' + dataframe + ', ".groups", function(df) xtabs(~' + rowName + '+' + colName + ', data=df))\n');
    echo('result.table <- lapply(table, chisq.test)\n');
    echo('result <- lapply(table, mcnemar.test)\n');
  } else {
    // Non-grouped mode
    echo('table <- xtabs(~' + rowName + '+' + colName + ', data=' + dataframe + ')\n');
    echo('result.table <- chisq.test(table)\n');
    echo('result <- mcnemar.test(table)\n');
  }
}

function printout() {
  // Header
  header = new Header(i18n("McNemar test of independence of %1 and %2", rowName, colName));
  header.add(i18n("Data frame"), dataframe);
  header.add(i18n("Paired variables"), rowName + ", " + colName);
  header.add(i18n("Null hypothesis"), i18n("There is no significant association between the variables."));
  header.add(i18n("Alternative hypothesis"), i18n("There is a significant association between the variables."));
  if (grouped) {
    header.add(i18n("Grouping variable(s)"), groupsName.join(", "));
  }
  if (filtered) {
    header.addFromUI("condition");
  }
  header.print();

  // Grouped mode
  if (grouped) {
    echo('for (i in 1:length(result)){\n');
    echo('\trk.header(paste(' + i18n("Group %1 =", groupsName.join('.')) + ', names(result)[i]), level=3)\n');
    echo('\trk.results(list(');
    echo(i18n("Chi statistic") + ' = result[[i]]$statistic, ');
    echo(i18n("Degrees of freedom") + ' = result[[i]]$parameter, ');
    echo(i18n("p-value") + ' = result[[i]]$p.value');
    echo('))\n');
    if (observed) {
      echo('rk.header(' + i18n("Observed frequencies") + ', level=3)\n');
      echo('rk.print(ftable(result.table[[i]]$observed))\n');
    }
    if (expected) {
      echo('rk.header(' + i18n("Expected frequencies") + ', level=3)\n');
      echo('rk.print(ftable(result.table[[i]]$expected))\n');
    }
    if (percentages) {
      echo('rk.header(' + i18n("Observed percentages") + ', level=3)\n');
      echo('rk.print(ftable(prop.table(result.table[[i]]$observed)*100))\n');
    }
    echo('}\n');
  } else {
    // Non-grouped mode
    echo('rk.results(list(');
    echo(i18n("Chi statistic") + ' = result$statistic, ');
    echo(i18n("Degrees of freedom") + ' = result$parameter, ');
    echo(i18n("p-value") + ' = result$p.value');
    echo('))\n');
    if (observed) {
      echo('rk.header(' + i18n("Observed frequencies") + ', level=3)\n');
      echo('rk.print(ftable(result.table$observed))\n');
    }
    if (expected) {
      echo('rk.header(' + i18n("Expected frequencies") + ', level=3)\n');
      echo('rk.print(ftable(result.table$expected))\n');
    }
    if (percentages) {
      echo('rk.header(' + i18n("Observed percentages") + ', level=3)\n');
      echo('rk.print(ftable(prop.table(result.table$observed)*100))\n');
    }
  }
}