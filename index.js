const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const password = encodeURIComponent("RP1wq8OPiKbRegN2");
const uri = `mongodb+srv://yue555:${password}@userdb.urornxb.mongodb.net/`;
const port = 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });


app.listen(port, () => {
    console.log('Server is running on port ' + port);
});

app.get('/',(req,res)=>{
    res.send('Welcome Hibiki Api');
})
// GET
async function getFreelancers(page = 1, perPage = 10) {
    try {
        page = parseInt(page);
        perPage = parseInt(perPage);
        
        const conn = await client.connect();
        const db = await conn.db("user_table");
        const coll = await db.collection("freelancers");

        const totalFreelancers = await coll.countDocuments();
        const totalPages = Math.ceil(totalFreelancers / perPage);

        let result;
        if (totalFreelancers > 0) {
            const skipCount = (page - 1) * perPage;
            if (skipCount < totalFreelancers) {
                result = await coll
                    .find()
                    .skip(skipCount)
                    .limit(Math.min(perPage, totalFreelancers - skipCount))
                    .toArray();
            } else {
                result = [];
            }
        } else {
            result = [];
        }

        await client.close();

        return {
            data: result,
            pagination: {
                totalItems: totalFreelancers,
                totalPages: totalPages,
                currentPage: page,
                perPage: perPage
            }
        };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

app.get('/freelancers', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const perPage = req.query.perPage || 10;
        const result = await getFreelancers(page, perPage);

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching freelancers data');
    }
});

async function getFreelancersDetail(ID) {
    try {      
        const conn = await client.connect();
        const db = await conn.db("user_table");
        const coll = await db.collection("freelancers");

        const freelancer = await coll.findOne({ _id: ID });

        if (!freelancer) {
            throw new Error('Freelancer not found');
        }

        await client.close();
        return {
            data: freelancer
        };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

app.get('/freelancers/:id', async (req, res) => {
    try {
        const ID = req.params.id;
        const result = await getFreelancersDetail(ID);

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching freelancers data');
    }
});

// ADD
async function createFreelancer(freelancerData) {
    try {
        const conn = await client.connect();
        const db = await conn.db("user_table");
        const coll = await db.collection("freelancers");
        const result = await coll.insertOne(freelancerData);
        return result;
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
}
app.post('/freelancers', async (req, res) => {
    try {
        const freelancerData = req.body;
        if (!freelancerData.username || !freelancerData.email || !freelancerData.phone_num) {
            return res.status(400).send('Username, email, and phone number are required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(freelancerData.email)) {
            return res.status(400).send('Invalid email format');
        }

        const phoneNumRegex = /^\d+$/;
        if (!phoneNumRegex.test(freelancerData.phone_num)) {
            return res.status(400).send('Phone number must contain only digits');
        }
        
        if (freelancerData.skillsets === undefined || freelancerData.skillsets.length === 0) {
            freelancerData.skillsets = [];
        }

        if (freelancerData.hobby === undefined || freelancerData.hobby.length === 0) {
            freelancerData.hobby = [];
        }

        const result = await createFreelancer(freelancerData);
        res.status(201).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating freelancer');
    }
});

// EDIT
async function updateFreelancerById(id, data) {
    try {
        const conn = await client.connect();
        const db = await conn.db("user_table");
        const collection = db.collection('freelancers');
        const objectId = new ObjectId(id);
        const result = await collection.updateOne({ _id: objectId }, { $set: data });
        await client.close();
        return result.modifiedCount > 0 ? data : null;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

app.put('/freelancers/:id', async (req, res) => {
    try {
        const freelancerId = req.params.id;
        const freelancerData = req.body;

        if (!ObjectId.isValid(freelancerId)) {
            return res.status(400).send('Invalid freelancer ID');
        }

        if (!freelancerData.username || !freelancerData.email || !freelancerData.phone_num) {
            return res.status(400).send('Username, email, and phone number are required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(freelancerData.email)) {
            return res.status(400).send('Invalid email format');
        }

        const phoneNumRegex = /^\d+$/;
        if (!phoneNumRegex.test(freelancerData.phone_num)) {
            return res.status(400).send('Phone number must contain only digits');
        }
        
        if (freelancerData.skillsets === undefined || freelancerData.skillsets.length === 0) {
            freelancerData.skillsets = [];
        }

        if (freelancerData.hobby === undefined || freelancerData.hobby.length === 0) {
            freelancerData.hobby = [];
        }

        const result = await updateFreelancerById(freelancerId, freelancerData);

        if (!result) {
            return res.status(404).send('Freelancer is same with before');
        }

        res.status(200).send(result);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating freelancer');
    }
});


// DELETE
async function deleteFreelancerById(freelancerId) {
    try {
        const conn = await client.connect();
        const db = await conn.db("user_table");
        const coll = await db.collection("freelancers");

        // Convert freelancerId to ObjectId
        const objectId = new ObjectId(freelancerId);
        console.log("Deleting freelancer with ID:", objectId);

        const result = await coll.deleteOne({ _id: objectId });
        console.log("Delete operation result:", result);

        return result.deletedCount;
    } catch (err) {
        console.log(err);
        throw new Error('Error deleting freelancer.');
    } finally {
        await client.close();
    }
}
app.delete('/freelancers/:id', async (req, res) => {
    const freelancerId = req.params.id;

    try {
        if (!ObjectId.isValid(freelancerId)) {
            return res.status(400).send('Invalid freelancer ID');
        }

        const result = await deleteFreelancerById(freelancerId);

        if (result.deletedCount === 0) {
            return res.status(404).send('Freelancer not found');
        }

        res.status(200).send('Freelancer deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting freelancer');
    }
});

app.all('*', (req, res) => {
    res.status(404).send('404 Not Found');
});