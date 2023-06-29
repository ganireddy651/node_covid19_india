// importing express
const express = require("express");
// coremodule path
const path = require("path");

// importing open() method from sqlite
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

// creating express instance
const app = express();
// Middleware function for parsing JSON Data
app.use(express.json());

// creating path to database
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

// method for connecting to database running the server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDBAndServer();

// GET States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const dbResponse = await db.all(getStatesQuery);
  const output = dbResponse.map((each) => ({
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  }));
  response.send(output);
});

// GET state API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  });
});

// Create District API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const createDistrictQuery = `INSERT 
  INTO 
  district(district_name,state_id,cases,cured,active,deaths)
  VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;

  const dbResponse = await db.run(createDistrictQuery);
  const districtId = dbResponse.lastID;
  console.log(districtId);
  response.send("District Successfully Added");
});

// GET District API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send({
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  });
});

// Delete District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId};`;
  const dbResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// Update District API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `UPDATE district SET
  district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} WHERE district_id=${districtId};`;
  const dbResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// GET Stats API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `SELECT SUM(cases) as totalCases,
  SUM(cured) as totalCured,
  SUM(active) as totalActive,
  SUM(deaths) as totalDeaths
  FROM district
  WHERE state_id = ${stateId};`;

  const dbResponse = await db.get(getStatsQuery);
  response.send(dbResponse);
});

// GET Details API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDetailsQuery = `SELECT state.state_name
  AS stateName
  FROM state
  INNER JOIN district ON state.state_id = district.state_id
  WHERE district_id = ${districtId};`;

  const dbResponse = await db.get(getDetailsQuery);
  response.send(dbResponse);
});

module.exports = app;
