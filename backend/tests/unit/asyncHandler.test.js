const asyncHandler = require("../../src/utils/asyncHandler");

function mockReq() { return {}; }
function mockRes() { return { status: jest.fn().mockReturnThis(), json: jest.fn() }; }
function mockNext() { return jest.fn(); }

describe("asyncHandler", () => {
  it("calls the wrapped async function with req/res/next", async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(fn);
    const [req, res, next] = [mockReq(), mockRes(), mockNext()];
    await wrapped(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next(err) when the async function rejects", async () => {
    const err = new Error("async failure");
    const fn = jest.fn().mockRejectedValue(err);
    const wrapped = asyncHandler(fn);
    const next = mockNext();
    await wrapped(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("calls next(err) when the function throws synchronously", async () => {
    const err = new Error("sync throw");
    const fn = jest.fn().mockImplementation(() => { throw err; });
    const wrapped = asyncHandler(fn);
    const next = mockNext();
    await wrapped(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
