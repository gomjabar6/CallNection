var oilCanvas = document.getElementById("oilChart");

Chart.defaults.global.defaultFontFamily = "Lato";
Chart.defaults.global.defaultFontSize = 18;

var oilData = {
    labels: [
        "Other",
        "Male",
        "Female"
    ],
    datasets: [
        {
            data: [1, 50, 60],
            backgroundColor: [
                "#FF6384",
                "red",
                "blue",
            ]
        }]
};

var pieChart = new Chart(oilCanvas, {
  type: 'pie',
  data: oilData
});