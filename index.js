const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const password = encodeURIComponent("RP1wq8OPiKbRegN2");
const uri = `mongodb+srv://yue555:${password}@userdb.urornxb.mongodb.net/`;
const port = 3000;


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


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

app.get('/',(req,res)=>{
    res.send('Welcome Hibiki Api');
})
// GET
async function getFreelancers(page = 1, perPage = 10) {
    try {
        const conn = await client.connect();
        const db = await conn.db("user_table");
        const coll = await db.collection("freelancers");

        const totalFreelancers = await coll.countDocuments();
        const totalPages = Math.ceil(totalFreelancers / perPage);

        const result = await coll
            .find()
            .skip((page - 1) * perPage)
            .limit(perPage)
            .toArray();

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
    } finally {
        await client.close();
    }
}
app.get('/freelancers',async(req,res)=>{
    try{
        const result = await getFreelancers()
        res.send(result);
    }catch (err) {
        res.status(500).send('Error fetching freelancers data');
    }
})

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
async function updateFreelancerById(){
    const conn = await client.connect();
    const db = await conn.db("user_table");
    const collection = db.collection('freelancers'); 
    const result = await collection.updateOne({ _id: ObjectId(id) }, { $set: data });
    return result.modifiedCount > 0 ? data : null;
}
app.put('/freelancers/:id', async (req, res) => {
    try {
        const freelancerId = req.params.id;
        const freelancerData = req.body;

        if (!ObjectId.isValid(freelancerId)) {
            return res.status(400).send('Invalid freelancer ID');
        }else{
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
                return res.status(404).send('Freelancer not found');
            }

            res.status(200).send(result);
        }

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
        const result = await coll.deleteOne({ _id: freelancerId });
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
        // Check if the provided ID is a valid ObjectId
        if (!ObjectId.isValid(freelancerId)) {
            return res.status(400).send('Invalid freelancer ID');
        }

        // Attempt to delete the freelancer with the provided ID
        const result = await deleteFreelancerById(freelancerId);

        // Check if a freelancer was deleted
        if (result.deletedCount === 0) {
            return res.status(404).send('Freelancer not found');
        }

        // Return success response
        res.status(200).send('Freelancer deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting freelancer');
    }
});

app.all('*', (req, res) => {
    res.status(404).send('404 Not Found');
});