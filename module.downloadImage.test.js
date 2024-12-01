const fs = require('fs');
const path = require('path');
const axios = require('axios');
const downloadImage = require('./module.downloadImage');

jest.mock('fs');
jest.mock('axios');

describe('downloadImage', () => {
  const token = process.env.telegram_token;
  const fileRemotePath = 'photos/file_1.jpg'; // Mock file path
  const fileLocalPath = path.join(__dirname, 'photos', 'file_1.jpg');

  beforeEach(() => {
    process.env.telegram_token = token;

    // Mock fs.existsSync
    fs.existsSync.mockImplementation((dir) => dir === path.join(__dirname, 'photos'));

    // Mock fs.mkdirSync
    fs.mkdirSync.mockImplementation(() => {});

    // Mock fs.createWriteStream
    const mockWriter = {
      on: jest.fn((event, callback) => {
        if (event === 'finish') callback();
      }),
      write: jest.fn(),
      end: jest.fn(),
    };
    fs.createWriteStream.mockReturnValue(mockWriter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the photos directory if it does not exist', async () => {
    fs.existsSync.mockReturnValue(false); // Simulate directory not existing

    axios.mockResolvedValue({
      data: {
        pipe: jest.fn(),
      },
    });

    await downloadImage(fileRemotePath, fileLocalPath);

    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(__dirname, 'photos'), { recursive: true });
  });

  it('should not create the photos directory if it already exists', async () => {
    fs.existsSync.mockReturnValue(true); // Simulate directory existing

    axios.mockResolvedValue({
      data: {
        pipe: jest.fn(),
      },
    });

    await downloadImage(fileRemotePath, fileLocalPath);

    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('should download the image and save it to the specified local path', async () => {
    const mockPipe = jest.fn();
    axios.mockResolvedValue({
      data: {
        pipe: mockPipe,
      },
    });

    await downloadImage(fileRemotePath, fileLocalPath);

    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileRemotePath}`;
    expect(axios).toHaveBeenCalledWith({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
    });
    expect(mockPipe).toHaveBeenCalled();
    expect(fs.createWriteStream).toHaveBeenCalledWith(fileLocalPath);
  });

  it('should throw an error if the download fails', async () => {
    axios.mockRejectedValue(new Error('Download failed'));

    await expect(downloadImage(fileRemotePath, fileLocalPath)).rejects.toThrow('Download failed');
  });

  it('should throw an error if writing the file fails', async () => {
    axios.mockResolvedValue({
      data: {
        pipe: jest.fn(),
      },
    });

    const mockWriter = {
      on: jest.fn((event, callback) => {
        if (event === 'error') callback(new Error('Write failed'));
      }),
      write: jest.fn(),
      end: jest.fn(),
    };
    fs.createWriteStream.mockReturnValue(mockWriter);

    await expect(downloadImage(fileRemotePath, fileLocalPath)).rejects.toThrow('Write failed');
  });
});
