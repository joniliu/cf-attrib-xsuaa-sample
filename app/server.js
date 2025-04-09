const express = require("express");
const passport = require("passport");
const { XssecPassportStrategy, XsuaaService } = require("@sap/xssec");
const xsenv = require("@sap/xsenv");

const app = express();
const DATABASE = new Array();

// Get XSUAA credentials
const UAA_CREDENTIALS = xsenv.getServices({
  uaa: { tag: "xsuaa" },
}).uaa;
// or: IdentityService, XsaService, UaaService ...
const authService = new XsuaaService(UAA_CREDENTIALS);

passport.use(new XssecPassportStrategy(authService));
app.use(passport.initialize());
app.use(passport.authenticate("JWT", { session: false }));
app.use(express.json());
app.use(logJwtMiddle);

/* App server */
app.listen(process.env.PORT);

/* App endpoints */
app.get("/user-info", (req, res) => {
  const user = req.user; // decoded JWT

  res.json({
    id: user.id,
    userInfo: user, // for debugging
  });
});

app.post("/create", (req, res) => {
  const auth = req.authInfo;
  //   console.log("==> AUTH:", JSON.stringify(auth, getCircularReplacer(), 2));
  // ref: https://www.npmjs.com/package/@sap/xssec => XsuaaSecurityContext
  if (!auth.checkScope(UAA_CREDENTIALS.xsappname + ".scopeforcreate")) {
    res.status(403).end("Forbidden. Missing authorization for create.");
  } else {
    const body = req.body;
    DATABASE.push({ name: body.name, special: body.isSpecial });
    res.send(
      `Employee name: '${body.name}', Requires attention: '${body.isSpecial}'`
    );
  }
});

app.put("/manage", (req, res) => {
  const auth = req.authInfo;
  const employeeName = req.body.name;

  const employeeEntry = DATABASE.find((e) => e.name == employeeName);
  if (employeeEntry == undefined) {
    return res.status(404).end(`Employee '${employeeName}' not found.`);
  }

  if (auth.checkScope(UAA_CREDENTIALS.xsappname + ".scopeformanage")) {
    res.send(
      `Salary increased for employee: '${employeeName}' by manager '${auth.getGivenName()}' .`
    );
  } else if (auth.checkScope(UAA_CREDENTIALS.xsappname + ".scopeforcreate")) {
    if (employeeEntry.special == "true") {
      if (hasSpecial(req)) {
        res.send(
          `Salary increased for employee: '${employeeName}' by assistant '${auth.getGivenName()}' .`
        );
      } else {
        res
          .status(403)
          .end(
            `Assistant '${auth.getGivenName()}' not allowed to manage '${employeeName}' due to missing special qualification.`
          );
      }
    } else {
      res.send(
        `Salary increased for employee: '${employeeName}' by assistant '${auth.getGivenName()}' .`
      );
    }
  } else {
    res
      .status(403)
      .end("Forbidden. Missing authorization for managing employee.");
  }
});

/* Middleware */
function logJwtMiddle(req, res, next) {
  const tokenEncoded = req.headers["authorization"].substring(7);
  let jwtBase64Encoded = tokenEncoded.split(".")[1];
  let jwtDecodedAsString = Buffer.from(jwtBase64Encoded, "base64").toString(
    "ascii"
  );
  let jwtDecoded = JSON.parse(jwtDecodedAsString);

  console.log(`===> The full JWT decoded: ${JSON.stringify(jwtDecoded)}`);
  console.log(`==> JWT scope: ${jwtDecoded.scope}`);
  console.log(
    `==> JWT role collections: ${JSON.stringify(
      jwtDecoded["xs.system.attributes"]
    )}`
  );
  console.log(
    `==> JWT user attributes: ${JSON.stringify(
      jwtDecoded["xs.user.attributes"]
    )}`
  );
  next();
}

/* HELPER */
function hasSpecial(req) {
  const jwtDecoded = req.tokenInfo.getPayload();
  const userAttrSpecial = jwtDecoded["xs.user.attributes"].SpecialTraining;
  return userAttrSpecial == "true";
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  };
};
